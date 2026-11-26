/** Safely read a key from Web Storage without throwing in sandboxed contexts. */
export function readStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Safely persist a key in Web Storage, returning whether the write succeeded. */
export function writeStorage(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Safely delete a key from Web Storage without throwing in private/blocked modes. */
export function removeStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage access may be restricted in sandboxed browsers; fail closed cleanly.
  }
}
