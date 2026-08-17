import { InventoryItem } from './inventory-domain';

export type PurchaseStatus =
  | 'draft' | 'pending-manager' | 'pending-finance' | 'approved' | 'rejected'
  | 'ordered' | 'partially-received' | 'received' | 'cancelled';
export type ReceiptMode = 'PO' | 'NON_PO' | 'LEGACY';
export type NonPoReason =
  | 'EMERGENCY_REPAIR' | 'LOCAL_PURCHASE' | 'WARRANTY_REPLACEMENT'
  | 'SUPPLIER_REPLACEMENT' | 'OTHER';

export interface PurchaseLine {
  lineId: string;
  inventoryId?: string | InventoryItem;
  name: string;
  sku: string;
  itemClass?: string;
  subcategory?: string;
  unit?: string;
  quantity: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  estimatedTotal: number;
}

export interface PurchaseRequest {
  _id: string;
  requestId: string;
  supplierId?: string;
  supplierName: string;
  totalEstimate: number;
  status: PurchaseStatus;
  statusVersion: number;
  priority: 'normal' | 'urgent';
  requestedBy: string;
  items: PurchaseLine[];
  poNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  notes?: string;
  createdAt?: Date | string;
}

export interface ReceiptAuthorization {
  _id: string;
  authorizationNumber: string;
  nonPoReason: NonPoReason;
  explanation: string;
  inventoryId?: InventoryItem;
  newItemSnapshot?: Partial<InventoryItem>;
  supplierId: { _id: string; name: string } | string;
  supplierName: string;
  authorizedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  estimatedTotal: number;
  affectedWorkType: string;
  affectedWorkId?: string;
  affectedWorkReference?: string;
  sourceDocumentNumber: string;
  supportingDocumentUrl?: string;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected' | 'partially-received' | 'completed';
  financeReviewStatus: 'not-required' | 'pending' | 'reconciled' | 'rejected';
  statusVersion: number;
  approvalComment?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export function outstanding(line: PurchaseLine): number {
  return Math.max(0, Number(line.orderedQuantity ?? line.quantity) - Number(line.receivedQuantity || 0));
}

export function purchaseStatusLabel(status: PurchaseStatus): string {
  return ({
    draft: 'Draft', 'pending-manager': 'Awaiting Manager', 'pending-finance': 'Awaiting Finance',
    approved: 'Approved', rejected: 'Rejected', ordered: 'Ordered / Receiving',
    'partially-received': 'Partially Received', received: 'Completed', cancelled: 'Cancelled',
  } as Record<PurchaseStatus, string>)[status];
}
