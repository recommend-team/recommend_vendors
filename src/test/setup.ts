import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * `lib/config.ts` throws when `VITE_API_BASE_URL` is missing, which is correct in a
 * browser and useless in a test runner. Stubbed once here so every suite has a base URL
 * without each of them remembering to set one.
 */
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000/api/v1');

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
