import { memo } from 'react';
import { ScrollView } from 'react-native';
import type { StorageLocation } from '../../types';
import { useScale } from '../../theme/scale';
import PantryChip from './PantryChip';

export type PantryStatusFilter = 'all' | 'low' | 'expiring';

interface PantryFilterChipsProps {
  locations: StorageLocation[];
  status: PantryStatusFilter;
  locationId: string | 'all';
  lowCount: number;
  expiringCount: number;
  onStatusChange: (status: PantryStatusFilter) => void;
  onLocationChange: (locationId: string | 'all') => void;
  labels: {
    all: string;
    low: string;
    expiring: string;
  };
}

function PantryFilterChips({
  locations,
  status,
  locationId,
  lowCount,
  expiringCount,
  onStatusChange,
  onLocationChange,
  labels,
}: PantryFilterChipsProps) {
  const { s } = useScale();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: s(8), paddingVertical: s(2), paddingRight: s(8) }}
      testID="pantry-filter-chips"
    >
      <PantryChip
        label={labels.all}
        selected={status === 'all' && locationId === 'all'}
        onPress={() => {
          onStatusChange('all');
          onLocationChange('all');
        }}
      />
      <PantryChip
        label={labels.low}
        selected={status === 'low'}
        count={lowCount}
        onPress={() => onStatusChange(status === 'low' ? 'all' : 'low')}
      />
      <PantryChip
        label={labels.expiring}
        selected={status === 'expiring'}
        count={expiringCount}
        onPress={() => onStatusChange(status === 'expiring' ? 'all' : 'expiring')}
      />
      {locations.map((loc) => (
        <PantryChip
          key={loc.id}
          label={loc.name}
          selected={locationId === loc.id}
          onPress={() => onLocationChange(locationId === loc.id ? 'all' : loc.id)}
        />
      ))}
    </ScrollView>
  );
}

export default memo(PantryFilterChips);
