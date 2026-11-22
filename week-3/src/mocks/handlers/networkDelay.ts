import { delay } from 'msw';

// Enough latency to see loading states in the browser, none in unit tests.
export function networkDelay() {
  return delay(import.meta.env.MODE === 'test' ? 0 : 350);
}
