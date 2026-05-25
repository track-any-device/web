export async function register() {
  // Node.js 25 ships a partial localStorage global that lacks .getItem unless
  // --localstorage-file is configured. Components that call localStorage at
  // import time crash during SSR. This polyfill makes it safe.
  if (typeof globalThis.localStorage === 'undefined' ||
      typeof globalThis.localStorage?.getItem !== 'function') {
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).localStorage = {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear:      () => { for (const k in store) delete store[k]; },
      key:        (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    };
  }
}
