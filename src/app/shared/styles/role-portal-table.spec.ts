import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

@Component({
  standalone: true,
  template: `
    <div class="role-portal-shell" style="--error: #c20e0e; --error-light: #fef2f2; --background-card: #fff; --text-primary: #2d3139; --text-secondary: #566463; --text-muted: #8a9e96; --primary-lighter: #e8fdf0;">
      <div id="table-container" class="alx-table-container" role="region" aria-label="Test inventory" tabindex="0">
        <table id="base-table" class="alx-table alx-table--fixed alx-table--sticky-header">
          <thead><tr><th class="actions-cell">Actions</th><th class="text-center">State</th></tr></thead>
          <tbody>
            <tr class="selected-row">
              <td class="sku-cell num-cell date-cell actions-cell">SKU-001</td>
              <td class="text-center">Selected</td>
            </tr>
            <tr id="normal-row"><td>SKU-002</td><td>Normal</td></tr>
          </tbody>
        </table>
      </div>
      <div id="embedded" class="alx-table-container alx-table-container--embedded">
        <table id="danger-table" class="alx-table alx-table--narrow alx-table--danger">
          <thead><tr><th>Quarantine</th></tr></thead>
          <tbody><tr><td><span class="alx-table-status">Pending</span></td></tr></tbody>
        </table>
      </div>
      <table id="medium-table" class="alx-table alx-table--medium"></table>
      <table id="wide-table" class="alx-table alx-table--wide"></table>
    </div>
    <div id="outside" class="alx-table-container"><table class="alx-table"><tr><td>Outside</td></tr></table></div>
  `,
})
class RolePortalTableHostComponent {}

describe('role portal table presentation contract', () => {
  let fixture: ComponentFixture<RolePortalTableHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RolePortalTableHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(RolePortalTableHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('applies the balanced compact table density inside a role portal', () => {
    const root = fixture.nativeElement as HTMLElement;
    const table = root.querySelector<HTMLTableElement>('#base-table')!;
    const header = table.querySelector('th')!;
    const cell = table.querySelector('td')!;
    const centeredCell = table.querySelector<HTMLElement>('.text-center')!;

    expect(getComputedStyle(table).minWidth).toBe('760px');
    expect(getComputedStyle(table).tableLayout).toBe('fixed');
    expect(getComputedStyle(header).padding).toBe('12px 16px');
    expect(getComputedStyle(header).fontSize).toBe('11px');
    expect(getComputedStyle(header).position).toBe('sticky');
    expect(getComputedStyle(cell).padding).toBe('12px 16px');
    expect(getComputedStyle(cell).fontSize).toBe('13px');
    expect(getComputedStyle(cell).textAlign).toBe('right');
    expect(getComputedStyle(centeredCell).textAlign).toBe('center');
    expect(getComputedStyle(cell).whiteSpace).toBe('nowrap');
  });

  it('provides scroll containment, row states, and semantic variants', () => {
    const root = fixture.nativeElement as HTMLElement;
    const shell = root.querySelector<HTMLElement>('.role-portal-shell')!;
    const container = root.querySelector<HTMLElement>('#table-container')!;
    const embedded = root.querySelector<HTMLElement>('#embedded')!;
    const dangerTable = root.querySelector<HTMLTableElement>('#danger-table')!;
    const selectedRow = root.querySelector<HTMLElement>('.selected-row')!;
    const normalRow = root.querySelector<HTMLElement>('#normal-row')!;
    const status = dangerTable.querySelector<HTMLElement>('.alx-table-status')!;

    expect(getComputedStyle(container).overflowX).toBe('auto');
    expect(getComputedStyle(container).borderRadius).toBe('14px');
    expect(container.getAttribute('aria-label')).toBe('Test inventory');
    expect(container.tabIndex).toBe(0);
    expect(getComputedStyle(selectedRow).backgroundColor).not.toBe(getComputedStyle(normalRow).backgroundColor);
    expect(getComputedStyle(shell).getPropertyValue('--alx-table-row-hover').trim()).toBe('rgb(0 0 0 / 1%)');
    expect(getComputedStyle(embedded).boxShadow).toBe('none');
    expect(getComputedStyle(dangerTable).minWidth).toBe('480px');
    expect(getComputedStyle(root.querySelector('#medium-table')!).minWidth).toBe('640px');
    expect(getComputedStyle(root.querySelector('#wide-table')!).minWidth).toBe('960px');
    expect(getComputedStyle(dangerTable.querySelector('th')!).backgroundColor).not.toBe(
      getComputedStyle(dangerTable.querySelector('td')!).backgroundColor,
    );
    expect(getComputedStyle(status).borderRadius).toBe('8px');
    expect(getComputedStyle(status).fontSize).toBe('11px');
    expect(getComputedStyle(status).textTransform).toBe('uppercase');
  });

  it('does not leak the table system outside a role portal shell', () => {
    const outside = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#outside')!;

    expect(getComputedStyle(outside).overflowX).not.toBe('auto');
    expect(getComputedStyle(outside.querySelector('table')!).minWidth).not.toBe('760px');
  });
});
