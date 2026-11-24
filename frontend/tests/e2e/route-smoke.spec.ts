import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Route Smoke Test Suite
 * Iterates docs/routes.manifest.json for all 24 active release scope routes across 3 viewports:
 * - 390px (Mobile)
 * - 768px (Tablet)
 * - 1440px (Desktop)
 * Asserts: HTTP success, no banned placeholder strings, no console errors,
 * captures full-page screenshots to test-results/screenshots/
 */

const MANIFEST_PATH = path.resolve(__dirname, '../../../docs/routes.manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' },
];

const BANNED_PATTERNS = [
  'Coming soon',
  'Lorem ipsum',
  'TODO',
  'Under construction',
];

// Helper to sanitize route path for screenshot filenames
function sanitizePath(routePath: string): string {
  return routePath.replace(/\//g, '_').replace(/:/g, '$').replace(/^_+/, '') || 'root';
}

test.describe('Route Smoke & Integrity Matrix (24 Release Scope Routes)', () => {
  for (const route of manifest) {
    // Only test active release scope routes
    if (!route.inReleaseScope || route.status === 'DEFERRED' || route.path.includes(':')) {
      continue;
    }

    for (const vp of VIEWPORTS) {
      test(`[${vp.name.toUpperCase()}] ${route.path} (${route.name})`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const txt = msg.text();
            // Ignore non-fatal benign dev server noise, expected 401/403 auth checks, or missing favicon
            if (
              !txt.includes('favicon.ico') &&
              !txt.includes('404 (Not Found)') &&
              !txt.includes('401 (Unauthorized)') &&
              !txt.includes('403 (Forbidden)')
            ) {
              consoleErrors.push(txt);
            }
          }
        });

        // Set viewport size
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Authenticate if user/admin route
        if (route.access !== 'public') {
          await page.goto('/login');
          const email = route.access === 'admin' ? 'admin@breatheiq.org' : 'user@breatheiq.org';
          const pass = route.access === 'admin' ? 'Admin123!' : 'Password123!';
          await page.fill('input[type="email"]', email);
          await page.fill('input[type="password"]', pass);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(800);
        }

        // Navigate to target route
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        if (route.path === '/404') {
          expect(response?.status()).toBeLessThan(500);
        } else {
          expect(response?.status()).toBeLessThan(400);
        }

        // Wait for components to mount
        await page.waitForTimeout(400);

        // Check for banned placeholder text in rendered DOM
        const bodyText = await page.innerText('body');
        for (const pattern of BANNED_PATTERNS) {
          expect(bodyText).not.toContain(pattern);
        }

        // Verify no unexpected console errors occurred
        expect(consoleErrors).toEqual([]);

        // Capture screenshot to test-results/screenshots/
        const screenshotDir = path.resolve(__dirname, '../../../test-results/screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(
          screenshotDir,
          `${sanitizePath(route.path)}_${vp.name}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
      });
    }
  }
});
