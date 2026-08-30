import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

@Component({
  standalone: true,
  template: `
    <div class="inventory-portal-shell">
      <button type="button" class="im-btn im-btn--primary">Save</button>
      <a class="im-btn im-btn--primary" href="/inventory-manager">Create</a>
      <button type="button" class="im-btn im-btn--secondary" disabled>Disabled</button>
      <button type="button" class="im-btn im-btn--danger">Delete</button>
    </div>
  `,
})
class InventoryManagerControlsTestHostComponent {}

describe('Inventory Manager controls presentation contract', () => {
  let fixture: ComponentFixture<InventoryManagerControlsTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryManagerControlsTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryManagerControlsTestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('applies the canonical primary treatment equally to buttons and anchors', () => {
    const root = fixture.nativeElement as HTMLElement;
    const buttonStyle = getComputedStyle(root.querySelector<HTMLButtonElement>('.im-btn--primary')!);
    const anchorStyle = getComputedStyle(root.querySelector<HTMLAnchorElement>('a.im-btn--primary')!);

    expect(buttonStyle.minHeight).toBe('40px');
    expect(buttonStyle.borderRadius).toBe('10px');
    expect(buttonStyle.fontWeight).toBe('600');
    expect(anchorStyle.minHeight).toBe(buttonStyle.minHeight);
    expect(anchorStyle.backgroundColor).toBe(buttonStyle.backgroundColor);
  });

  it('keeps disabled and destructive states distinct', () => {
    const root = fixture.nativeElement as HTMLElement;
    const disabled = root.querySelector<HTMLButtonElement>('.im-btn--secondary')!;
    const danger = root.querySelector<HTMLButtonElement>('.im-btn--danger')!;

    expect(disabled.disabled).toBeTrue();
    expect(getComputedStyle(disabled).opacity).toBe('0.55');
    expect(getComputedStyle(danger).backgroundColor).not.toBe(
      getComputedStyle(root.querySelector<HTMLButtonElement>('.im-btn--primary')!).backgroundColor,
    );
  });
});
