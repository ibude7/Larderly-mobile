import { bestEffortPushCleanup } from '../pushCleanup';

describe('bestEffortPushCleanup', () => {
  it('unregisters the current user token', async () => {
    const unregister = jest.fn().mockResolvedValue(undefined);

    await expect(bestEffortPushCleanup('user-1', unregister)).resolves.toBeUndefined();
    expect(unregister).toHaveBeenCalledWith('user-1');
  });

  it('never traps sign-out when token cleanup fails', async () => {
    const unregister = jest.fn().mockRejectedValue(new Error('offline'));
    const warn = jest.fn();

    await expect(bestEffortPushCleanup('user-1', unregister, warn)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('[Larderly] Push cleanup failed', expect.any(Error));
  });

  it('does nothing without a user id', async () => {
    const unregister = jest.fn();

    await bestEffortPushCleanup('', unregister);
    expect(unregister).not.toHaveBeenCalled();
  });
});
