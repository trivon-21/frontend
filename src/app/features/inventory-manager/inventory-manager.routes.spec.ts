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

  it('attaches pendingChangesGuard to order-creation and procurement routes', () => {
    const root = INVENTORY_MANAGER_ROUTES[0];
    const children = root.children ?? [];

    const orderCreation = children.find((r) => r.path === 'order-creation');
    const procurement = children.find((r) => r.path === 'procurement');

    expect(orderCreation?.canDeactivate).toEqual([pendingChangesGuard]);
    expect(procurement?.canDeactivate).toEqual([pendingChangesGuard]);
  });

  it('has no standalone order form routes; the form opens as a modal on the list page', () => {
    const root = INVENTORY_MANAGER_ROUTES[0];
    const children = root.children ?? [];

    expect(children.find((r) => r.path === 'order-creation/new')).toBeUndefined();
    expect(children.find((r) => r.path === 'order-creation/edit/:id')).toBeUndefined();
    expect(children.find((r) => r.path === 'order-creation')).toBeDefined();
  });
});
