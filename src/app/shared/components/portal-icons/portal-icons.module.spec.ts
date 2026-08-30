import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PORTAL_ICON_NAMES, PortalIconsModule } from './portal-icons.module';

@Component({
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  template: `
    <div class="role-portal-shell">
      <lucide-angular *ngFor="let icon of icons" [name]="icon"></lucide-angular>
      <div class="alx-table-container" id="inside"><table class="alx-table"><tr><td>Inside</td></tr></table></div>
    </div>
    <div class="alx-table-container" id="outside"><table class="alx-table"><tr><td>Outside</td></tr></table></div>
  `,
})
class PortalFoundationHostComponent {
  icons = PORTAL_ICON_NAMES;
}

describe('portal presentation foundations', () => {
  it('renders every registered portal icon as an SVG', async () => {
    const fixture = TestBed.createComponent(PortalFoundationHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('lucide-angular svg').length)
      .toBe(PORTAL_ICON_NAMES.length);
  });

  it('applies table containment only below the role portal shell', () => {
    const fixture = TestBed.createComponent(PortalFoundationHostComponent);
    fixture.detectChanges();
    const inside = getComputedStyle(fixture.nativeElement.querySelector('#inside'));
    const outside = getComputedStyle(fixture.nativeElement.querySelector('#outside'));

    expect(inside.overflowX).toBe('auto');
    expect(outside.overflowX).not.toBe('auto');
  });
});
