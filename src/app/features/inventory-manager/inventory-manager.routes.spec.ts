import { INVENTORY_MANAGER_ROUTES } from './inventory-manager.routes';
import { pendingChangesGuard } from '../../core/guards/pending-changes.guard';

describe('INVENTORY_MANAGER_ROUTES unsaved-changes protection contract', () => {
  it('attaches pendingChangesGuard to product create and edit routes', () => {
    const root = INVENTORY_MANAGER_ROUTES[0];
    const children = root.children ?? [];

    const productCreate = children.find((r) => r.path === 'product-wizard');
    const productEdit = children.find((r) => r.path === 'product-wizard/:id');

    expect(productCreate?.canDeactivate).toEqual([pendingChangesGuard]);
    expect(productEdit?.canDeactivate).toEqual([pendingChangesGuard]);
  });

  it('attaches pendingChangesGuard to order create and edit routes', () => {
    const root = INVENTORY_MANAGER_ROUTES[0];
    const children = root.children ?? [];

    const orderCreate = children.find((r) => r.path === 'order-creation/new');
    const orderEdit = children.find((r) => r.path === 'order-creation/edit/:id');

    expect(orderCreate?.canDeactivate).toEqual([pendingChangesGuard]);
    expect(orderEdit?.canDeactivate).toEqual([pendingChangesGuard]);
  });
});
