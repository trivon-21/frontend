import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    service = new ConfirmService();
  });

  it('opens with the given options, defaulting title/labels/variant', (done) => {
    service.state$.subscribe((state) => {
      if (!state.isOpen) return;
      expect(state.title).toBe('Confirm');
      expect(state.message).toBe('Discard your edits?');
      expect(state.confirmText).toBe('Yes');
      expect(state.cancelText).toBe('No');
      expect(state.variant).toBe('default');
      done();
    });

    void service.confirm({ message: 'Discard your edits?' });
  });

  it('resolves true and closes on accept()', async () => {
    const result = service.confirm({ message: 'Proceed?' });
    service.accept();

    expect(await result).toBeTrue();
    let isOpen = true;
    service.state$.subscribe((s) => (isOpen = s.isOpen));
    expect(isOpen).toBeFalse();
  });

  it('resolves false and closes on cancel()', async () => {
    const result = service.confirm({ message: 'Proceed?' });
    service.cancel();

    expect(await result).toBeFalse();
  });

  it('carries a danger variant through to state', (done) => {
    service.state$.subscribe((state) => {
      if (!state.isOpen) return;
      expect(state.variant).toBe('danger');
      done();
    });

    void service.confirm({ message: 'Discard?', variant: 'danger', confirmText: 'Discard', cancelText: 'Keep editing' });
  });

  it('resolves a superseded confirm() as cancelled rather than leaving it pending', async () => {
    const first = service.confirm({ message: 'First' });
    const second = service.confirm({ message: 'Second' });

    // Only the second prompt is now open/resolvable.
    service.accept();

    expect(await first).toBeFalse();
    expect(await second).toBeTrue();
  });
});
