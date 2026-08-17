import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';

const LAND_TIERS = {
  16: require('../../assets/tiles/blender-cube-land-2d.png'),
  25: require('../../assets/tiles/blender-land-25-grid.png'),
  36: require('../../assets/tiles/blender-land-36-grid.png'),
  64: require('../../assets/tiles/blender-land-64-grid.png'),
} as const;

export type GridTier = 16 | 25 | 36 | 64;

const TIER_ORDER: GridTier[] = [16, 25, 36, 64];

interface IsometricLandViewProps {
  isFocusing?: boolean;
  progress?: number;
  initialGridSize?: GridTier;
}

export function IsometricLandView({
  isFocusing = false,
  progress = 0,
  initialGridSize = 25,
}: IsometricLandViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneWidth = Math.min(windowWidth - 32, 360);

  const [currentGrid, setCurrentGrid] = useState<GridTier>(initialGridSize);

  const handleCycleGrid = () => {
    setCurrentGrid(prev => {
      const idx = TIER_ORDER.indexOf(prev);
      return TIER_ORDER[(idx + 1) % TIER_ORDER.length];
    });
  };

  const activeAsset = LAND_TIERS[currentGrid];
  const landHeight = Math.round(sceneWidth * 0.60);

  const tierLabels: Record<GridTier, string> = {
    16: '🌱 16 Cubes (4x4)',
    25: '✨ 25 Cubes (5x5)',
    36: '🌿 36 Cubes (6x6)',
    64: '👑 64 Cubes (8x8)',
  };

  return (
    <View style={[styles.container, { width: sceneWidth, height: landHeight + 40 }]}>
      {/* Background Soft Sunlight Aura */}
      <View style={styles.sunlightAura} />

      {/* Ground Shadow */}
      <View style={styles.groundShadowWrap}>
        <View style={styles.groundShadow} />
      </View>

      {/* 100% Fully Displayed Static 2D Isometric Land */}
      <View style={[styles.islandWrap, { width: sceneWidth, height: landHeight }]}>
        <Image
          source={activeAsset}
          style={styles.islandImage}
          resizeMode="contain"
        />

        {/* Center Hero: Glowing Dragon Egg resting on land */}
        <View style={[styles.eggOverlay, { top: '14%' }]}>
          <Svg width={62} height={76} viewBox="0 0 68 82">
            <Defs>
              <SvgRadialGradient id="eggGrad2D" cx="36%" cy="32%" r="65%">
                <Stop offset="0%" stopColor="#FFF9E6" />
                <Stop offset="30%" stopColor="#F9C868" />
                <Stop offset="70%" stopColor="#E08B32" />
                <Stop offset="100%" stopColor="#874312" />
              </SvgRadialGradient>

              <SvgLinearGradient id="eggCrack2D" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="50%" stopColor="#FFE066" />
                <Stop offset="100%" stopColor="#FF9900" />
              </SvgLinearGradient>
            </Defs>

            {/* Egg Shadow on Top Plates */}
            <Ellipse cx={34} cy={72} rx={20} ry={6} fill="rgba(35, 45, 20, 0.45)" />

            {/* Egg Body */}
            <G transform="translate(34, 40)">
              <Path
                d="M 0,-36 C -18,-36 -26,-6 -26,14 C -26,28 -15,34 0,34 C 15,34 26,28 26,14 C 26,-6 18,-36 0,-36 Z"
                fill="url(#eggGrad2D)"
              />

              {/* Dragon Scale Texture Rings */}
              <Path
                d="M -13,-9 Q 0,0 13,-9"
                stroke="#B86618"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />
              <Path
                d="M -16,7 Q 0,17 16,7"
                stroke="#B86618"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />

              {/* Glowing Dragon Life Energy Crack */}
              <Path
                d="M 0,-16 L -5,-7 L 5,2 L -2,13 L 3,22"
                stroke="url(#eggCrack2D)"
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M -5,-7 L -11,-2"
                stroke="#FFE066"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 5,2 L 11,6"
                stroke="#FFE066"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
              />

              {/* Specular Highlight */}
              <Ellipse
                cx={-6}
                cy={-22}
                rx={7}
                ry={3.5}
                fill="#FFFFFF"
                opacity={0.6}
                transform="rotate(-20 -6 -22)"
              />
            </G>
          </Svg>
        </View>
      </View>

      {/* Grid Expansion Badge / Quick Cycle Switcher */}
      <TouchableOpacity
        style={styles.expansionBadge}
        activeOpacity={0.8}
        onPress={handleCycleGrid}
      >
        <Text style={styles.expansionBadgeText}>
          {tierLabels[currentGrid]}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunlightAura: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(235, 245, 195, 0.16)',
  },
  groundShadowWrap: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    backgroundColor: 'rgba(15, 45, 35, 0.30)',
    width: 280,
    height: 48,
    borderRadius: 24,
  },
  islandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  islandImage: {
    width: '100%',
    height: '100%',
  },
  eggOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expansionBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  expansionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A5D4E',
  },
});
