import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useAppColors } from '../../hooks/useAppColors';

interface PantryCardSkeletonProps {
  listMode?: boolean;
}

export default function PantryCardSkeleton({ listMode }: PantryCardSkeletonProps) {
  const c = useAppColors();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = listMode ? windowWidth - 40 : (windowWidth - 52) / 2;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: c.line,
          backgroundColor: c.surface,
          flex: listMode ? undefined : 1,
          width: listMode ? undefined : cardWidth,
        },
        listMode ? styles.listCard : null,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: `${c.muted}33` }]} />

      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <Skeleton width="100%" height={16} radius={4} />
          <View style={[styles.shortTitleLine, styles.lineGap]}>
            <Skeleton width="100%" height={14} radius={4} />
          </View>
        </View>
        <Skeleton width={48} height={48} radius={8} />
      </View>

      <Skeleton width={86} height={18} radius={9} style={styles.badge} />

      <View style={[styles.bottomRow, { borderTopColor: c.line }]}>
        <Skeleton width={64} height={20} radius={10} />
        <Skeleton width={82} height={20} radius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 140,
    overflow: 'hidden',
    padding: 16,
  },
  listCard: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  accent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  titleColumn: {
    flex: 1,
  },
  lineGap: {
    marginTop: 6,
  },
  shortTitleLine: {
    width: '70%',
  },
  badge: {
    marginLeft: 4,
    marginTop: 12,
  },
  bottomRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingLeft: 4,
    paddingTop: 12,
  },
});
