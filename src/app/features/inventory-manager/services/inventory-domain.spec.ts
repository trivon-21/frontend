import {
  isValidSubcategory,
  normalizeInventoryList,
} from './inventory-domain';

describe('inventory domain', () => {
  it('accepts only subcategories belonging to the selected product class', () => {
    expect(isValidSubcategory('Spare Parts', 'Compressor')).toBeTrue();
    expect(isValidSubcategory('Spare Parts', 'Vacuum Pump')).toBeFalse();
  });

  it('normalizes chip values without duplicates or blanks', () => {
    expect(normalizeInventoryList([' R32 ', 'R410A', 'R32', ''])).toEqual(['R32', 'R410A']);
  });
});
