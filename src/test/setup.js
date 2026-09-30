import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { clearQueryCache } from '@/hooks/useApiQuery';

afterEach(() => {
  cleanup();
  clearQueryCache(); // each test starts with no cached API answers
  sessionStorage.clear();
});

// jsdom gaps used by the app shell (sonner's theme detection, ScrollToTop).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
window.scrollTo = () => {};
