import { Platform, StyleSheet, Text, View } from 'react-native';
import { SettingsGlass } from '../settings/SettingsGlass';
import { SettingsIconWell } from '../settings/SettingsIconWell';
import {
  Beef,
  Calendar,
  Heart,
  Leaf,
  Milk,
  Package,
  ShoppingBasket,
  Wheat,
  type GlyphIcon,
} from '../ui/Glyph';
import { landingFonts as SF } from '../../theme/landing';
import { brandBlue, brandGreen, brandOrange, brandPurple, brandRose } from '../../theme/brand';
import { fitScale } from '../../theme/scale';
import { useLandingColors } from '../../hooks/useLandingColors';

const DESIGN_W = 360;
const DESIGN_H = 318;

const METRICS: ReadonlyArray<{
  label: string;
  value: string;
  color: string;
  Icon: GlyphIcon;
}> = [
  { label: 'Items', value: '128', color: brandGreen.DEFAULT, Icon: Package },
  { label: 'Expiring', value: '18', color: brandOrange.DEFAULT, Icon: Calendar },
  { label: 'Low stock', value: '7', color: brandOrange.light, Icon: ShoppingBasket },
  { label: 'Favorites', value: '42', color: brandPurple.DEFAULT, Icon: Heart },
];

const BARS: ReadonlyArray<{
  label: string;
  value: string;
  ratio: number;
  color: string;
  Icon: GlyphIcon;
}> = [
  { label: 'Produce', value: '32 / 50', ratio: 0.64, color: brandGreen.DEFAULT, Icon: Leaf },
  { label: 'Pantry', value: '46 / 70', ratio: 0.66, color: brandOrange.light, Icon: Wheat },
  { label: 'Protein', value: '18 / 30', ratio: 0.6, color: brandRose.DEFAULT, Icon: Beef },
  { label: 'Dairy', value: '12 / 20', ratio: 0.6, color: brandBlue.DEFAULT, Icon: Milk },
];

/** Forward-facing frosted glass kitchen overview chart for landing slide 2. */
export function KitchenOverviewChart({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const scale = fitScale(width, height, DESIGN_W, DESIGN_H);
  const lc = useLandingColors();
  const artworkW = DESIGN_W * scale;
  const artworkH = DESIGN_H * scale;

  if (scale <= 0) return null;

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      radius={28 * scale}
      style={{ width: artworkW, height: artworkH }}
      contentStyle={{
        width: artworkW,
        height: artworkH,
        paddingHorizontal: 16 * scale,
        paddingTop: 16 * scale,
        paddingBottom: 14 * scale,
        gap: 12 * scale,
      }}
    >
      <Text
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
        style={[
          styles.title,
          {
            fontSize: 18 * scale,
            lineHeight: 22 * scale,
            color: lc.ink,
          },
        ]}
      >
        Your kitchen overview
      </Text>

      <View style={[styles.metricsRow, { gap: 8 * scale }]}>
        {METRICS.map(({ label, value, color, Icon }) => (
          <SettingsGlass
            key={label}
            interactive={false}
            elevated={false}
            accent={color}
            radius={14 * scale}
            style={styles.metricCard}
            contentStyle={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10 * scale,
              paddingHorizontal: 4 * scale,
              gap: 5 * scale,
              minHeight: 78 * scale,
            }}
          >
            <SettingsIconWell
              icon={Icon}
              color={color}
              size={26}
              iconSize={13}
              shape="circle"
            />
            <Text
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              style={[
                styles.metricValue,
                {
                  fontSize: 16 * scale,
                  lineHeight: 18 * scale,
                  color,
                },
              ]}
            >
              {value}
            </Text>
            <Text
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              style={[
                styles.metricLabel,
                {
                  fontSize: 9 * scale,
                  lineHeight: 11 * scale,
                  color,
                },
              ]}
            >
              {label}
            </Text>
          </SettingsGlass>
        ))}
      </View>

      <SettingsGlass
        interactive={false}
        elevated={false}
        radius={16 * scale}
        style={{ flex: 1, minHeight: 0 }}
        contentStyle={{
          flex: 1,
          paddingHorizontal: 12 * scale,
          paddingVertical: 10 * scale,
          gap: 8 * scale,
        }}
      >
        <Text
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
          style={[
            styles.sectionTitle,
            {
              fontSize: 13 * scale,
              lineHeight: 16 * scale,
              color: lc.ink,
              marginBottom: 2 * scale,
            },
          ]}
        >
          Inventory at a glance
        </Text>

        {BARS.map(({ label, value, ratio, color, Icon }) => (
          <View
            key={label}
            style={[styles.barRow, { gap: 8 * scale, minHeight: 28 * scale }]}
          >
            <SettingsIconWell
              icon={Icon}
              color={color}
              size={24}
              iconSize={12}
              shape="circle"
            />
            <View style={styles.barCopy}>
              <View style={styles.barHeader}>
                <Text
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  style={[
                    styles.barLabel,
                    {
                      fontSize: 11 * scale,
                      lineHeight: 13 * scale,
                      color: lc.ink,
                    },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  style={[
                    styles.barValue,
                    {
                      fontSize: 10 * scale,
                      lineHeight: 12 * scale,
                      color: lc.muted,
                    },
                  ]}
                >
                  {value}
                </Text>
              </View>
              <View
                style={[
                  styles.barTrack,
                  {
                    height: 7 * scale,
                    borderRadius: 999,
                    marginTop: 4 * scale,
                    backgroundColor: `${color}22`,
                  },
                ]}
              >
                <View
                  style={{
                    width: `${Math.round(ratio * 100)}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: color,
                  }}
                />
              </View>
            </View>
          </View>
        ))}
      </SettingsGlass>
    </SettingsGlass>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: SF.serif,
    flexShrink: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontFamily: SF.serif,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  metricLabel: {
    fontFamily: SF.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : undefined,
  },
  sectionTitle: {
    fontFamily: SF.serif,
    flexShrink: 0,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  barCopy: {
    flex: 1,
    minWidth: 0,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  barValue: {
    fontFamily: SF.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : undefined,
  },
  barTrack: {
    width: '100%',
    overflow: 'hidden',
  },
});
