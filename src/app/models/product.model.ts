/**
 * product.model.ts
 * Defines the TypeScript interfaces for the Product domain.
 * All components consume these types; update here if the data shape changes.
 */

/**
 * Represents a single capacity/price tier the user can choose from.
 */
export interface CapacityOption {
  label: string; // e.g. "1.5 Ton"
  price: number; // e.g. 125000
}

/**
 * Represents a single technical specification row (label + value).
 */
export interface ProductSpecification {
  label: string; // e.g. "Cooling Capacity"
  value: string; // e.g. "1.5 Ton (18,000 BTU)"
}

/**
 * Represents a warranty period with its title and a short description.
 */
export interface WarrantyTerm {
  title: string; // e.g. "Comprehensive Warranty (2 Years)"
  description: string; // e.g. "Covers all parts and labor…"
}

/**
 * The main Product interface.
 * All data displayed on the product detail page should map to this interface.
 */
export interface Product {
  /** MongoDB document ID (string from API) or numeric ID */
  _id?: string;
  id?: number;

  /** Display name of the product */
  name: string;

  /** Base price in the given currency */
  price: number;

  /** ISO currency code displayed alongside the price */
  currency: string;

  /** Whether the product is currently in stock */
  inStock: boolean;

  /** Available capacity/price combinations shown in the dropdown */
  capacityOptions: CapacityOption[];

  /** Short paragraph describing the product */
  description: string;

  /** Bullet-point feature highlights shown with checkmarks */
  features: string[];

  /** Technical specification rows shown in the Specifications tab */
  specifications: ProductSpecification[];

  /** Warranty period entries shown in the Warranty tab */
  warrantyTerms: WarrantyTerm[];

  /** Items covered under the warranty */
  warrantyCovered: string[];

  /** Items NOT covered under the warranty */
  warrantyNotCovered: string[];

  /**
   * Array of image paths.
   * Index 0 is the default main image; 1–3 are thumbnails.
   * These paths are relative to the Angular app's public/ folder.
   */
  images: string[];
}
