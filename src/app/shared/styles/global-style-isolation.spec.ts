describe('global modal style isolation', () => {
  const mountedElements: HTMLElement[] = [];

  function mountModal(shellClass: string): HTMLElement {
    const shell = document.createElement('div');
    shell.className = shellClass;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    backdrop.appendChild(modal);
    shell.appendChild(backdrop);
    document.body.appendChild(shell);
    mountedElements.push(shell);

    return modal;
  }

  afterEach(() => {
    mountedElements.splice(0).forEach((element) => element.remove());
  });

  it('applies the modal treatment inside the Technician page wrapper', () => {
    const modal = mountModal('page-wrapper');
    const styles = getComputedStyle(modal);

    expect(styles.paddingTop).toBe('40px');
    expect(styles.maxWidth).toBe('800px');
  });

  it('does not apply the Technician modal treatment inside the Inventory portal', () => {
    const modal = mountModal('inventory-portal-shell');
    const styles = getComputedStyle(modal);

    expect(styles.paddingTop).not.toBe('40px');
    expect(styles.maxWidth).not.toBe('800px');
  });

  it('does not apply the Technician modal treatment inside the Manager portal', () => {
    const modal = mountModal('manager-portal-shell');
    const styles = getComputedStyle(modal);

    expect(styles.paddingTop).not.toBe('40px');
    expect(styles.maxWidth).not.toBe('800px');
  });
});
