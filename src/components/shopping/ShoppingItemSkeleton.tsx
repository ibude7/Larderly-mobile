import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useAppColors } from '../../hooks/useAppColors';

export default function ShoppingItemSkeleton() {
  const c = useAppColors();

  return (
    <View style={[styles.row, { borderColor: c.line, backgroundColor: c.surface }]}>
      <Skeleton width={6} height={6} radius={3} />
      <Skeleton width={20} height={20} radius={10} />
      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <Skeleton width="100%" height={16} radius={4} />
        </View>
        <View style={[styles.meta, styles.metaLine]}>
          <Skeleton width="100%" height={12} radius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
  },
  titleLine: {
    width: '70%',
  },
  meta: {
    marginTop: 6,
  },
  metaLine: {
    width: '34%',
  },
});
