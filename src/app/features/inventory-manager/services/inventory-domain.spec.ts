import {
  isValidSubcategory,
  normalizeInventoryList,
  supplierIdOf,
  supplierNameOf,
  toBusinessDateString,
  isLoanOverdue,
} from './inventory-domain';

describe('inventory domain', () => {
  it('accepts only subcategories belonging to the selected product class', () => {
    expect(isValidSubcategory('Spare Parts', 'Compressor')).toBeTrue();
    expect(isValidSubcategory('Spare Parts', 'Vacuum Pump')).toBeFalse();
  });

  it('normalizes chip values without duplicates or blanks', () => {
    expect(normalizeInventoryList([' R32 ', 'R410A', 'R32', ''])).toEqual(['R32', 'R410A']);
  });

  it('handles an explicitly cleared supplier reference', () => {
    const item = { supplierId: null } as never;

    expect(supplierIdOf(item)).toBe('');
    expect(supplierNameOf(item)).toBe('');
  });

  describe('date-only and business timezone semantics', () => {
    it('formats dates in Asia/Colombo business timezone without drift', () => {
      expect(toBusinessDateString('2026-09-05')).toBe('2026-09-05');
      expect(toBusinessDateString('2024-02-29')).toBe('2024-02-29');
      expect(toBusinessDateString('2026-09-05T00:00:00.000Z')).toBe('2026-09-05');

      // 2026-09-05 20:00 UTC is 2026-09-06 01:30 in Asia/Colombo
      const eveningUtc = new Date('2026-09-05T20:00:00.000Z');
      expect(toBusinessDateString(eveningUtc, 'Asia/Colombo')).toBe('2026-09-06');
    });

    it('keeps a tool on time for its entire stated due date and flags overdue only on next business day', () => {
      const dueDate = '2026-09-05';
      // Same day afternoon
      const sameDayAfternoon = new Date('2026-09-05T10:00:00.000Z'); // 15:30 Colombo
      expect(isLoanOverdue(dueDate, sameDayAfternoon, 'Asia/Colombo')).toBeFalse();

      // Same day 23:55 Colombo (18:25 UTC)
      const sameDayLateNight = new Date('2026-09-05T18:25:00.000Z');
      expect(isLoanOverdue(dueDate, sameDayLateNight, 'Asia/Colombo')).toBeFalse();

      // Next day 00:05 Colombo (18:35 UTC)
      const nextDayMidnight = new Date('2026-09-05T18:35:00.000Z');
      expect(isLoanOverdue(dueDate, nextDayMidnight, 'Asia/Colombo')).toBeTrue();
    });
  });
});

