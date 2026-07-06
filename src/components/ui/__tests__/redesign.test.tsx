import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '../Badge';
import { Icon, IconName } from '../Icon';

describe('Orchard OS redesigned UI components', () => {
  it('renders Badge variants with vivid palette', async () => {
    const { getByText } = await render(
      <>
        <Badge label="Low stock" variant="warning" />
        <Badge label="Expired" variant="danger" />
        <Badge label="In stock" variant="success" />
      </>,
    );
    expect(getByText('Low stock')).toBeTruthy();
    expect(getByText('Expired')).toBeTruthy();
    expect(getByText('In stock')).toBeTruthy();
  });

  it('renders lucide-backed icons for every semantic name group', async () => {
    const names: IconName[] = [
      'dashboard', 'pantry', 'scanner', 'shopping', 'meals', 'sparkles', 'warning',
      'vegetables', 'dairy', 'seafood', 'fridge', 'freezer', 'shelf', 'sun', 'egg',
      'google', 'apple',
    ];
    const tree = await render(
      <>
        {names.map((n) => (
          <Icon key={n} name={n} size={20} />
        ))}
      </>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});
