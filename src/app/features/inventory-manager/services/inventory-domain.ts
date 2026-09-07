export type InventoryItemClass =
  | 'AC Equipment'
  | 'Spare Parts'
  | 'Installation Materials'
  | 'Consumables'
  | 'Tools and Test Equipment'
  | 'Kits and Bundles'
  | 'Unclassified';

export type InventorySystemType =
  | 'Split'
  | 'Cassette'
  | 'Ducted'
  | 'Multi-Split'
  | 'VRF/VRV'
  | 'Packaged/Rooftop'
  | 'AHU/FCU'
  | 'Universal'
  | 'Not Applicable';

export type InventoryItemForm = 'Single' | 'Kit' | 'Bundle';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type InventoryPhase = 'Single Phase' | 'Three Phase' | 'Not Applicable';

export const INVENTORY_ITEM_CLASSES: InventoryItemClass[] = [
  'AC Equipment',
  'Spare Parts',
  'Installation Materials',
  'Consumables',
  'Tools and Test Equipment',
  'Kits and Bundles',
  'Unclassified',
];

export const INVENTORY_SUBCATEGORIES: Record<InventoryItemClass, string[]> = {
  'AC Equipment': ['Split Indoor Unit', 'Split Outdoor Unit', 'Cassette Unit', 'Ducted Unit', 'Multi-Split / VRF Unit', 'Fan-Coil / Air-Handling Unit', 'Packaged / Rooftop Unit'],
  'Spare Parts': ['Compressor', 'Fan Motor', 'Blower / Fan Blade', 'Coil', 'PCB / Inverter Board', 'Electrical Control', 'Sensor / Thermostat / Remote', 'Valve', 'Filter-Drier / Sight Glass', 'Drain Pump / Louver Motor'],
  'Installation Materials': ['Copper Tube / Line Set', 'Copper Fitting / Flare Nut', 'Pipe Insulation', 'Drain Pipe / Hose', 'Bracket / Stand / Vibration Pad', 'Electrical / Communication Cable', 'Isolator / Breaker / Trunking', 'Ducting', 'Fastener / Tape / Sealant'],
  Consumables: ['Refrigerant', 'Nitrogen', 'Oil / Lubricant', 'Brazing Material', 'Cleaning Chemical', 'Disposable Filter', 'Sealant / Service Tape'],
  'Tools and Test Equipment': ['Vacuum Pump', 'Recovery Machine', 'Manifold Gauge', 'Vacuum / Micron Gauge', 'Leak Detector', 'Refrigerant Scale', 'Electrical Meter', 'Thermometer / Psychrometer / Anemometer', 'Flaring / Swaging Tool', 'Tube Tool', 'Torque Wrench'],
  'Kits and Bundles': ['Installation Kit', 'Line-Set Kit', 'Drain Kit', 'Maintenance Kit', 'Compressor Replacement Kit', 'Technician Tool Kit'],
  Unclassified: ['Unclassified'],
};

export const INVENTORY_SYSTEM_TYPES: InventorySystemType[] = [
  'Split', 'Cassette', 'Ducted', 'Multi-Split', 'VRF/VRV', 'Packaged/Rooftop', 'AHU/FCU', 'Universal', 'Not Applicable',
];

export const INVENTORY_ITEM_FORMS: InventoryItemForm[] = ['Single', 'Kit', 'Bundle'];
export const INVENTORY_UNITS = ['units', 'kits', 'sets', 'meters', 'rolls', 'kg', 'cylinders', 'liters'];
export const INVENTORY_PHASES: InventoryPhase[] = ['Single Phase', 'Three Phase', 'Not Applicable'];

export interface InventoryLocationOption {
  warehouse: string;
  placementAreas: string[];
}

export interface SupplierReference {
  _id: string;
  name?: string;
}

export interface InventoryItem {
  _id?: string;
  id?: string;
  name: string;
  sku: string;
  available: number;
  reserved: number;
  reorderLevel: number;
  maxStockLevel: number;
  status: 'critical' | 'warning' | 'normal';
  stockStatus?: StockStatus;
  type: InventoryItemForm;
  category: string;
  itemClass?: InventoryItemClass;
  subcategory?: string;
  brand: string;
  manufacturerPartNumber?: string;
  compatibleModels?: string[];
  systemType?: InventorySystemType;
  refrigerants?: string[];
  capacityBtu?: number | null;
  voltage?: string;
  phase?: InventoryPhase;
  location: string;
  binLocation?: string;
  supplierId?: string | SupplierReference | null;
  supplierName?: string;
  unit: string;
  unitCost: number;
  pricing?: {
    costPerUnit?: number;
    profitMargin?: number;
    sellingPricePerUnit?: number;
  };
  isSerialized: boolean;
  serialNumbers?: string[];
  availableSerialNumbers?: string[];
  suggestedQuantity?: number;
  specsUrl?: string;
  time?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMasterDataInput {
  name: string;
  itemClass: InventoryItemClass;
  subcategory: string;
  brand: string;
  manufacturerPartNumber?: string;
  type: InventoryItemForm;
  unit: string;
  reorderLevel: number;
  maxStockLevel: number;
  unitCost: number;
  location: string;
  binLocation: string;
  supplierId?: string | null;
  isSerialized: boolean;
  compatibleModels: string[];
  systemType: InventorySystemType;
  refrigerants: string[];
  capacityBtu?: number | null;
  voltage?: string;
  phase: InventoryPhase;
  specsUrl?: string;
}

export interface CreateInventoryCatalogItemInput extends InventoryMasterDataInput {
  sku: string;
}

export type UpdateInventoryMasterDataInput = InventoryMasterDataInput;

export function isValidSubcategory(itemClass: InventoryItemClass, subcategory: string): boolean {
  return (INVENTORY_SUBCATEGORIES[itemClass] || []).includes(subcategory);
}

export function normalizeInventoryList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function deriveStockStatus(item: Pick<InventoryItem, 'available' | 'reorderLevel'>): StockStatus {
  const available = Math.max(0, Number(item.available) || 0);
  const reorderLevel = Math.max(0, Number(item.reorderLevel) || 0);
  if (available === 0) return 'out-of-stock';
  if (available <= reorderLevel) return 'low-stock';
  return 'in-stock';
}

export function supplierNameOf(item: InventoryItem): string {
  if (item.supplierName) return item.supplierName;
  return item.supplierId && typeof item.supplierId === 'object' ? item.supplierId.name || '' : '';
}

export function supplierIdOf(item: InventoryItem): string {
  return item.supplierId && typeof item.supplierId === 'object' ? item.supplierId._id : item.supplierId || '';
}

export const BUSINESS_TIMEZONE = 'Asia/Colombo';

export function toBusinessDateString(
  date: Date | string | number = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  if (!date) return '';
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.000)?Z?$/);
    if (isoMatch) {
      return isoMatch[1];
    }
  }

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
    return d.toISOString().slice(0, 10);
  }

  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    } catch {
      // Fallback
    }
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isLoanOverdue(
  dueDate: Date | string | number | null | undefined,
  referenceDate: Date | string | number = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): boolean {
  if (!dueDate) return false;
  const dueStr = toBusinessDateString(dueDate, timeZone);
  const currentStr = toBusinessDateString(referenceDate, timeZone);
  if (!dueStr || !currentStr) return false;
  return dueStr < currentStr;
}

