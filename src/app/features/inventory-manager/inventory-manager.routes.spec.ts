import { NewOrderFormComponent } from './pages/order-creation/new-order-form/new-order-form.component';
import { INVENTORY_MANAGER_ROUTES } from './inventory-manager.routes';

describe('INVENTORY_MANAGER_ROUTES', () => {
  const children = INVENTORY_MANAGER_ROUTES[0].children ?? [];

  it('does not register the removed catalog-health routes', () => {
    expect(children.some((route) => route.path === 'catalog-health')).toBeFalse();
    expect(children.some((route) => route.path === 'list-items')).toBeFalse();
  });

  it('declares specific order-form paths before the order list', () => {
    const newIndex = children.findIndex((route) => route.path === 'order-creation/new');
    const editIndex = children.findIndex((route) => route.path === 'order-creation/edit/:id');
    const listIndex = children.findIndex((route) => route.path === 'order-creation');

    expect(children[newIndex].component).toBe(NewOrderFormComponent);
    expect(children[editIndex].component).toBe(NewOrderFormComponent);
    expect(newIndex).toBeLessThan(listIndex);
    expect(editIndex).toBeLessThan(listIndex);
  });

  it('keeps unknown Inventory Manager URLs inside the portal', () => {
    expect(children.at(-1)).toEqual(jasmine.objectContaining({
      path: '**',
      redirectTo: '/inventory-manager',
    }));
  });
});
