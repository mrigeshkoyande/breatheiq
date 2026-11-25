import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.resolve(__dirname, '../../../docs/routes.manifest.json');
interface RouteEntry {
  path: string;
  name: string;
  access: 'public' | 'user' | 'moderator' | 'admin';
  inReleaseScope?: boolean;
  status?: string;
}
const manifest: RouteEntry[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' },
];

const BANNED_PATTERNS = ['Coming soon', 'Lorem ipsum', 'TODO', 'Under construction'];

function sanitizePath(routePath: string): string {
  return routePath.replace(/\//g, '_').replace(/:/g, '$').replace(/^_+/, '') || 'root';
}

async function verifyRouteAtViewport(
  page: Page,
  route: RouteEntry,
  vp: { width: number; height: number; name: string }
) {
  const consoleErrors: string[] = [];
  const listener = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (
        !txt.includes('favicon.ico') &&
        !txt.includes('404 (Not Found)') &&
        !txt.includes('401 (Unauthorized)') &&
        !txt.includes('403 (Forbidden)')
      ) {
        consoleErrors.push(txt);
      }
    }
  };
  page.on('console', listener);

  try {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const response = await page.goto(route.path, { waitUntil: 'networkidle' });
    if (route.path === '/404') {
      expect(response?.status()).toBeLessThan(500);
    } else {
      expect(response?.status()).toBeLessThan(400);
    }

    await page.waitForSelector('h1', { timeout: 10000 });
    const bodyText = await page.innerText('body');
    for (const pattern of BANNED_PATTERNS) {
      expect(bodyText).not.toContain(pattern);
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
    expect(consoleErrors).toEqual([]);

    const screenshotDir = path.resolve(__dirname, '../../../test-results/screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${sanitizePath(route.path)}_${vp.name}.png`),
      fullPage: true,
    });
  } finally {
    page.off('console', listener);
  }
}

const activeRoutes = manifest.filter(
  (r) => r.inReleaseScope && r.status !== 'DEFERRED' && !r.path.includes(':')
);
const publicRoutes = activeRoutes.filter((r) => r.access === 'public');
const userRoutes = activeRoutes.filter((r) => r.access === 'user');
const adminRoutes = activeRoutes.filter((r) => r.access === 'admin' || r.access === 'moderator');

test.describe('Public Routes (3-Viewport Smoke & WCAG 2.2 AA)', () => {
  for (const route of publicRoutes) {
    for (const vp of VIEWPORTS) {
      test(`[${vp.name.toUpperCase()}] ${route.path} (${route.name})`, async ({ page }) => {
        await verifyRouteAtViewport(page, route, vp);
      });
    }
  }
});

test.describe('Authenticated User Routes (3-Viewport Smoke & WCAG 2.2 AA)', () => {
  test('Verify all user routes across 390/768/1440px and interactive routine persistence', async ({
    browser,
  }) => {
    test.setTimeout(180000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@breatheiq.org');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 10000 });

    for (const route of userRoutes) {
      for (const vp of VIEWPORTS) {
        await verifyRouteAtViewport(page, route, vp);
      }
    }

    // Verify real DB persistence across reload on /app/dashboard
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/app/dashboard', { waitUntil: 'networkidle' });
    const firstTask = page.locator('button[data-testid="routine-task-toggle"]').first();
    await firstTask.waitFor({ state: 'visible', timeout: 8000 });
    const before = await firstTask.getAttribute('aria-pressed');
    await firstTask.click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    const reloadedTask = page.locator('button[data-testid="routine-task-toggle"]').first();
    await reloadedTask.waitFor({ state: 'visible', timeout: 8000 });
    const after = await reloadedTask.getAttribute('aria-pressed');
    expect(after).not.toBe(before);
    await reloadedTask.click();

    await context.close();
  });
});

test.describe('Admin Routes (3-Viewport Smoke & WCAG 2.2 AA)', () => {
  test('Verify admin command center across 390/768/1440px', async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@breatheiq.org');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 10000 });

    for (const route of adminRoutes) {
      for (const vp of VIEWPORTS) {
        await verifyRouteAtViewport(page, route, vp);
      }
    }

    await context.close();
  });
});
