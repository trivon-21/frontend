import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const order = {
  orderId: 'DSP-TEST-001', customer: 'Synthetic Customer', type: 'Delivery', status: 'to-pack',
  statusVersion: 3, date: '2026-11-18',
  items: [{ name: 'Demo Air Conditioner', sku: 'DEMO-AC', qty: 1, confirmed: false }],
};
async function openDispatch(page, { failLoad = false } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'synthetic-browser-fixture');
    localStorage.setItem('user', JSON.stringify({ id: 'fixture', role: 'INVENTORY', fullName: 'Demo Inventory' }));
  });
  let loads = 0;
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/inventory/orders' && request.method() === 'GET') {
      loads++;
      return route.fulfill({ status: failLoad && loads === 1 ? 500 : 200, json: failLoad && loads === 1 ? { message: 'Unavailable' } : [order] });
    }
    if (request.method() === 'PATCH' && path.includes('/inventory/orders/')) {
      return route.fulfill({ status: 409, json: { message: 'Order changed. Refresh before retrying.' } });
    }
    if (path.includes('/config/') || path.includes('/maintenance')) return route.fulfill({ json: { success: false, maintenance: false } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/inventory-manager/dispatch-logistics');
  await expect(page.getByRole('heading', { name: 'Dispatch & logistics' })).toBeVisible();
}
test('Spartan dialog traps focus, restores it, and preserves errors and HTTP payloads', async ({ page }) => {
  await openDispatch(page);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/dispatch-desktop.png', fullPage: true });
  const trigger = page.getByRole('button', { name: 'Pack order', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('hlm-dialog-content')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/dispatch-dialog.png' });
  await expect(dialog.getByRole('heading', { name: 'Order DSP-TEST-001' })).toBeVisible();
  for (let count = 0; count < 8; count++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole('button', { name: 'Reserve item', exact: true }).click();
  const requestPromise = page.waitForRequest(r => r.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Save packing status' }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ items: [{ ...order.items[0], confirmed: true }], statusVersion: 3 });
  await expect(dialog.getByRole('alert')).toHaveText('Order changed. Refresh before retrying.');
  await expect(dialog.getByRole('button', { name: 'Reserved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test('load retry and search empty state are actionable', async ({ page }) => {
  await openDispatch(page, { failLoad: true });
  await expect(page.getByRole('heading', { name: 'Dispatch unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('DSP-TEST-001', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search dispatch orders' }).fill('missing-reference');
  await expect(page.getByRole('heading', { name: 'No matching orders' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByText('DSP-TEST-001', { exact: true })).toBeVisible();
});
test('mobile layout contains the table without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDispatch(page);
  await expect(page.getByRole('button', { name: 'Pack order', exact: true })).toBeVisible();
  const content = await page.locator('.dashboard-content').boundingBox();
  expect(content.width).toBeGreaterThan(350);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dispatch-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Pack order', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
});
