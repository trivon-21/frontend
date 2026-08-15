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
  capacityBtu?: number;
  voltage?: string;
  phase?: 'Single Phase' | 'Three Phase' | 'Not Applicable';
  location: string;
  binLocation?: string;
  supplierId?: string | SupplierReference;
  supplierName?: string;
  unit: string;
  unitCost: number;
  isSerialized: boolean;
  serialNumbers?: string[];
  availableSerialNumbers?: string[];
  suggestedQuantity?: number;
  specsUrl?: string;
  time?: string;
  createdAt?: string;
  updatedAt?: string;
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
  return typeof item.supplierId === 'object' ? item.supplierId.name || '' : '';
}

export function supplierIdOf(item: InventoryItem): string {
  return typeof item.supplierId === 'object' ? item.supplierId._id : item.supplierId || '';
}
