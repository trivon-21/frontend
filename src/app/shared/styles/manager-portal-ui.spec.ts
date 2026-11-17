import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

@Component({
  standalone: true,
  template: `
    <div class="manager-portal-shell">
      <button type="button" class="mgr-btn mgr-btn--primary">Save</button>
      <a class="mgr-btn mgr-btn--primary" href="/manager">Open</a>
      <button type="button" class="mgr-btn mgr-btn--secondary" disabled>Disabled</button>
      <button type="button" class="mgr-btn mgr-btn--danger">Reject</button>
    </div>
    <div class="inventory-portal-shell">
      <button type="button" class="mgr-btn mgr-btn--primary">Inventory control</button>
    </div>
    <div class="super-admin-shell">
      <button type="button" class="mgr-btn mgr-btn--primary">Admin control</button>
    </div>
  `,
})
class ManagerPortalUiTestHostComponent {}

describe('Manager portal UI presentation contract', () => {
  let fixture: ComponentFixture<ManagerPortalUiTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ManagerPortalUiTestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(ManagerPortalUiTestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('gives Manager buttons and anchors the same canonical primary treatment', () => {
    const root = fixture.nativeElement as HTMLElement;
    const buttonStyle = getComputedStyle(root.querySelector<HTMLButtonElement>('.manager-portal-shell button.mgr-btn--primary')!);
    const anchorStyle = getComputedStyle(root.querySelector<HTMLAnchorElement>('.manager-portal-shell a.mgr-btn--primary')!);

    expect(buttonStyle.height).toBe('40px');
    expect(buttonStyle.borderRadius).toBe('10px');
    expect(buttonStyle.fontWeight).toBe('600');
    expect(anchorStyle.height).toBe(buttonStyle.height);
    expect(anchorStyle.backgroundColor).toBe(buttonStyle.backgroundColor);
  });

  it('keeps disabled and destructive states distinct', () => {
    const root = fixture.nativeElement as HTMLElement;
    const disabled = root.querySelector<HTMLButtonElement>('.manager-portal-shell .mgr-btn--secondary')!;
    const danger = root.querySelector<HTMLButtonElement>('.manager-portal-shell .mgr-btn--danger')!;
    const primary = root.querySelector<HTMLButtonElement>('.manager-portal-shell .mgr-btn--primary')!;

    expect(disabled.disabled).toBeTrue();
    expect(getComputedStyle(disabled).opacity).toBe('0.55');
    expect(getComputedStyle(danger).backgroundColor).not.toBe(getComputedStyle(primary).backgroundColor);
  });

  it('shows a visible keyboard focus ring', () => {
    const primary = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.manager-portal-shell .mgr-btn--primary',
    )!;

    primary.focus();

    expect(getComputedStyle(primary).outlineWidth).toBe('3px');
    expect(getComputedStyle(primary).outlineOffset).toBe('2px');
  });

  it('does not apply Manager control styling in other portal shells', () => {
    const root = fixture.nativeElement as HTMLElement;
    const manager = root.querySelector<HTMLButtonElement>('.manager-portal-shell .mgr-btn')!;
    const inventory = root.querySelector<HTMLButtonElement>('.inventory-portal-shell .mgr-btn')!;
    const admin = root.querySelector<HTMLButtonElement>('.super-admin-shell .mgr-btn')!;

    expect(getComputedStyle(inventory).height).not.toBe(getComputedStyle(manager).height);
    expect(getComputedStyle(admin).borderRadius).not.toBe(getComputedStyle(manager).borderRadius);
  });
});
