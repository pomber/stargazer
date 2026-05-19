import { waitForNoInput } from './wait-for-no-input';

describe('waitForNoInput', () => {
  let abortController: AbortController;

  beforeEach(() => {
    abortController = new AbortController();
  });

  test('resolves after the specified time when signal is not aborted', async () => {
    const timeout = 10; // ms
    const startTime = Date.now();
    
    await waitForNoInput(abortController.signal, timeout);
    
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    // Check that it waited for approximately the right amount of time
    expect(elapsed).toBeGreaterThanOrEqual(timeout);
  });

  test('rejects with "stale" error when signal is already aborted', async () => {
    abortController.abort();
    
    await expect(waitForNoInput(abortController.signal, 10)).rejects.toThrow('stale');
  });

  test('rejects with "stale" error when signal is aborted during wait', async () => {
    const timeout = 50; // ms
    
    // Set a timeout to abort the signal during the wait
    setTimeout(() => {
      abortController.abort();
    }, 10);
    
    await expect(waitForNoInput(abortController.signal, timeout)).rejects.toThrow('stale');
  });

  test('cleanup: resolves without aborting when timeout completes first', async () => {
    const timeout = 10; // ms
    
    // Wait for the timeout to complete
    const promise = waitForNoInput(abortController.signal, timeout);
    
    // Let the timeout resolve
    await expect(promise).resolves.not.toThrow();
  });
});