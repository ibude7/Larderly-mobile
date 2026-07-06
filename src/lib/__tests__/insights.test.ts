import {
  balanceSuggestions,
  buildSuggestions,
  mostPurchasedItems,
  sustainabilityMetrics,
  type ActivityEvent,
  type InventoryItem,
} from '../insights';

function ts(ms: number) {
  return { toMillis: () => ms };
}

const inventory: InventoryItem[] = [
  { id: '1', name: 'Milk', quantity: 0, category: 'dairy', expirationDate: Date.now() + 86_400_000 },
  { id: '2', name: 'Apples', quantity: 5, category: 'produce', expirationDate: Date.now() + 10 * 86_400_000 },
];

const activity: ActivityEvent[] = [
  { verb: 'item.added', target: 'Milk', createdAt: ts(Date.now() - 2 * 86_400_000) },
  { verb: 'item.consumed', target: 'Milk', createdAt: ts(Date.now() - 86_400_000) },
  { verb: 'item.added', target: 'Apples', createdAt: ts(Date.now()) },
];

describe('insight generation', () => {
  it('builds suggestions from inventory and activity', () => {
    expect(buildSuggestions(inventory, activity, [{ productName: 'Milk' }]).length).toBeGreaterThan(0);
  });

  it('detects balance suggestions from sparse categories', () => {
    const imbalanced = [
      { id: '1', name: 'Milk', quantity: 1, category: 'dairy' },
      { id: '3', name: 'Rice', quantity: 10, category: 'pantry' },
      { id: '4', name: 'Pasta', quantity: 6, category: 'pantry' },
      { id: '5', name: 'Beans', quantity: 5, category: 'pantry' },
      { id: '6', name: 'Flour', quantity: 4, category: 'pantry' },
      { id: '7', name: 'Sugar', quantity: 3, category: 'pantry' },
    ];
    expect(balanceSuggestions(imbalanced).some((suggestion) => suggestion.kind === 'balance')).toBe(true);
  });

  it('counts most purchased items', () => {
    expect(mostPurchasedItems(activity)[0]).toEqual({ name: 'Milk', count: 1 });
  });

  it('calculates sustainability metrics', () => {
    expect(sustainabilityMetrics(activity, inventory).co2SavedKg).toBe(1.5);
  });
});
