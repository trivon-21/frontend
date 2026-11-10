import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDetailModalComponent } from './order-detail-modal.component';
import { OrderLookupResult } from '../../services/manager-customers.service';

describe('OrderDetailModalComponent', () => {
  let component: OrderDetailModalComponent;
  let fixture: ComponentFixture<OrderDetailModalComponent>;

  const mockOrder: OrderLookupResult = {
    id: 'ord-101',
    category: 'Product Order',
    reference: 'SRQ-1008',
    orderType: 'Buy Only',
    status: 'Delivered',
    paymentStatus: 'Approved',
    orderStatus: 'Delivered',
    customer: {
      fullName: 'Sunil Silva',
      email: 'sunil@example.com',
      phoneNumber: '0712345678',
      address: '45 Galle Road, Colombo',
    },
    items: [
      {
        name: 'Airlux Inverter 12000 BTU',
        price: 45000,
        quantity: 1,
        purchaseType: 'buy_only',
        total: 45000,
      },
    ],
    subtotal: 45000,
    additionalCharges: 0,
    total: 45000,
    createdAt: '2026-06-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('renders order details when visible is true', () => {
    component.visible = true;
    component.order = mockOrder;
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.order-ref-title')?.textContent).toContain('SRQ-1008');
    expect(root.querySelector('.info-value')?.textContent).toContain('Sunil Silva');
    expect(root.querySelector('.total-amount')?.textContent).toContain('LKR 45,000');
  });

  it('emits closed event when close button is clicked', () => {
    component.visible = true;
    component.order = mockOrder;
    fixture.detectChanges();

    spyOn(component.closed, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('.btn-close-modal') as HTMLButtonElement;
    closeBtn.click();

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('emits closed event on escape key press', () => {
    component.visible = true;
    spyOn(component.closed, 'emit');

    component.onEscape();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('formats currency with LKR prefix', () => {
    expect(component.formatCurrency(12500)).toBe('LKR 12,500');
    expect(component.formatCurrency(0)).toBe('LKR 0');
  });
});
