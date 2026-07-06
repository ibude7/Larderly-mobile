import { categoryFromName } from '../categories';

describe('categoryFromName', () => {
  it.each([
    ['milk', 'dairy'],
    ['cheddar cheese', 'dairy'],
    ['salmon fillet', 'meat'],
    ['baguette', 'bakery'],
    ['orange juice', 'beverages'],
    ['potato chips', 'snacks'],
    ['banana', 'produce'],
    ['tomato', 'produce'],
    ['rice', 'pantry'],
    ['pasta sauce', 'pantry'],
    ['frozen pizza', 'frozen'],
    ['cumin spice', 'spices'],
    ['cereal oats', 'breakfast'],
    ['ketchup', 'condiments'],
    ['dish soap', 'other'],
    ['granola bar', 'snacks'],
    ['coffee', 'beverages'],
    ['yogurt cup', 'dairy'],
    ['carrot', 'produce'],
    ['unknown thing', 'other'],
  ])('%s maps to %s', (name, expected) => {
    expect(categoryFromName(name).id).toBe(expected);
  });
});
