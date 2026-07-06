import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

export default function DashboardStatSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((index) => (
        <StatTileSkeleton key={index} />
      ))}
    </View>
  );
}

function StatTileSkeleton() {
  const c = useAppColors();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 34, 0.5)' : 'rgba(255, 255, 255, 0.4)',
          shadowColor: theme === 'dark' ? '#000' : '#A09C96',
          shadowOpacity: theme === 'dark' ? 0.4 : 0.12,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: `${c.primary}33` }]} />
      <View style={styles.content}>
        <Skeleton width={52} height={36} radius={8} />
        <View style={[styles.label, styles.labelLine]}>
          <Skeleton width="100%" height={12} radius={4} />
        </View>
        <View style={[styles.trend, styles.trendLine]}>
          <Skeleton width="100%" height={10} radius={4} />
        </View>
      </View>
      <Skeleton width={32} height={32} radius={16} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    minHeight: 127,
    overflow: 'hidden',
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    width: '47.5%',
  },
  accent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 85,
    paddingLeft: 8,
  },
  label: {
    marginTop: 8,
  },
  labelLine: {
    width: '80%',
  },
  trend: {
    marginTop: 12,
  },
  trendLine: {
    width: '62%',
  },
  icon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
