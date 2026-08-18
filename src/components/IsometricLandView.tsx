import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, Path, useClock } from '@shopify/react-native-skia';
import { useDerivedValue, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import {
  EmberMote,
  GroveCreatureSprite,
  GroveEgg,
  GroveTreeSprite,
  GroveTuftSprite,
  WaterGlint,
} from './grove/GroveActors';
import { shade, withAlpha } from '../grove/color';
import { generateGrove, landBounds, visibleTiles } from '../grove/generate';
import { aerial, CRUST, diamondPath, faceColors, facePath, fitCamera, WATER_Z } from '../grove/iso';
import { grovePalette, lidColor } from '../grove/palette';
import type { TagKey } from '../theme';

export interface IsometricLandViewProps {
  seed: number;
  isFocusing?: boolean;
  progress?: number;
  focusMinutes?: number;
  sessionsCompleted?: number;
  tag?: TagKey;
}

type DrawItem =
  | { key: string; depth: number; layer: 0; kind: 'column'; x: number; y: number }
  | { key: string; depth: number; layer: 1; kind: 'tree'; index: number }
  | { key: string; depth: number; layer: 1; kind: 'tuft'; index: number }
  | { key: string; depth: number; layer: 2; kind: 'ember' }
  | { key: string; depth: number; layer: 3; kind: 'egg' }
  | { key: string; depth: number; layer: 4; kind: 'creature' };

export function IsometricLandView({
  seed,
  isFocusing = false,
  progress = 0,
  focusMinutes = 10,
  sessionsCompleted = 0,
  tag = 'work',
}: IsometricLandViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneWidth = Math.min(windowWidth - 24, 380);
  const sceneHeight = Math.round(sceneWidth * 0.78);
  const reducedMotion = useReducedMotion();
  const clock = useClock();
  const speed = useSharedValue(1);
  const progressSV = useSharedValue(progress);
  const focusingSV = useSharedValue(isFocusing ? 1 : 0);

  useEffect(() => {
    speed.value = isFocusing ? 0.65 : 1;
    focusingSV.value = isFocusing ? 1 : 0;
  }, [focusingSV, isFocusing, speed]);

  useEffect(() => {
    progressSV.value = progress;
  }, [progress, progressSV]);

  const time = useDerivedValue(() => {
    if (reducedMotion) return 0;
    return clock.value * speed.value;
  });

  const world = useMemo(
    () => generateGrove({ seed, focusMinutes, sessionsCompleted, tag }),
    [focusMinutes, seed, sessionsCompleted, tag]
  );
  const palette = useMemo(
    () => grovePalette(world.climate, world.mood, world.season),
    [world.climate, world.mood, world.season]
  );
  const tiles = useMemo(() => visibleTiles(world), [world]);
  const bbox = useMemo(() => landBounds(tiles), [tiles]);
  const camera = useMemo(() => fitCamera(bbox, sceneWidth, sceneHeight), [bbox, sceneHeight, sceneWidth]);
  const visibleKeys = useMemo(() => new Set(tiles.map((tile) => `${tile.x},${tile.y}`)), [tiles]);

  const items = useMemo(() => {
    const list: DrawItem[] = tiles.map((tile) => ({
      key: `c-${tile.x}-${tile.y}`,
      depth: tile.x + tile.y,
      layer: 0,
      kind: 'column',
      x: tile.x,
      y: tile.y,
    }));
    world.trees.forEach((tree, index) => {
      list.push({ key: `t-${tree.x}-${tree.y}`, depth: tree.x + tree.y + 0.4, layer: 1, kind: 'tree', index });
    });
    world.tufts.forEach((tuft, index) => {
      list.push({ key: `u-${tuft.x}-${tuft.y}`, depth: tuft.x + tuft.y + 0.35, layer: 1, kind: 'tuft', index });
    });
    list.push({ key: 'ember', depth: world.egg.x + world.egg.y + 0.48, layer: 2, kind: 'ember' });
    list.push({ key: 'egg', depth: world.egg.x + world.egg.y + 0.5, layer: 3, kind: 'egg' });
    list.push({
      key: 'creature',
      depth: world.creature.homeX + world.creature.homeY + 0.55,
      layer: 4,
      kind: 'creature',
    });
    list.sort((a, b) => a.depth - b.depth || a.layer - b.layer);
    return list;
  }, [tiles, world]);

  const waterTiles = tiles.filter((tile) => tile.kind === 'water');
  const eggTile = world.tiles[world.egg.y][world.egg.x];
  const creatureHome = world.tiles[world.creature.homeY][world.creature.homeX];
  const creatureDest = world.tiles[world.creature.destY][world.creature.destX];

  return (
    <View style={[styles.container, { width: sceneWidth, height: sceneHeight }]} accessibilityLabel="Dragon grove island">
      <View
        style={[
          styles.sunlightAura,
          {
            width: sceneWidth * 0.84,
            height: sceneWidth * 0.84,
            borderRadius: sceneWidth * 0.42,
            backgroundColor: palette.skyGlow,
          },
        ]}
      />
      <View
        style={[
          styles.groundShadow,
          {
            width: sceneWidth * 0.74,
            height: Math.max(38, sceneHeight * 0.16),
            borderRadius: sceneHeight * 0.08,
            backgroundColor: palette.shadow,
          },
        ]}
      />
      <Canvas style={{ width: sceneWidth, height: sceneHeight }}>
        <Circle cx={sceneWidth * 0.72} cy={sceneHeight * 0.16} r={sceneWidth * 0.18} color={palette.skyGlow} />
        {items.map((item) => {
          if (item.kind === 'column') {
            const tile = world.tiles[item.y][item.x];
            const right = item.x + 1 < world.n ? world.tiles[item.y][item.x + 1] : null;
            const down = item.y + 1 < world.n ? world.tiles[item.y + 1][item.x] : null;
            const zt = tile.kind === 'water' ? WATER_Z : tile.height;
            const rightShown = right !== null && visibleKeys.has(`${item.x + 1},${item.y}`);
            const downShown = down !== null && visibleKeys.has(`${item.x},${item.y + 1}`);
            const zr = !rightShown ? -CRUST : right.kind === 'water' ? WATER_Z : right.height;
            const zd = !downShown ? -CRUST : down.kind === 'water' ? WATER_Z : down.height;
            const lid = aerial(lidColor(tile.kind, palette), tile.x, tile.y, bbox, palette.haze);
            const faces = faceColors(tile.kind === 'water' ? palette.water : lid);
            const leftFace = zr < zt ? facePath(item.x + 1, item.y, item.x + 1, item.y + 1, zt, zr, camera) : null;
            const rightFace = zd < zt ? facePath(item.x, item.y + 1, item.x + 1, item.y + 1, zt, zd, camera) : null;
            const stone =
              tile.kind !== 'water' && leftFace
                ? facePath(item.x + 1, item.y, item.x + 1, item.y + 1, zt - (zt + CRUST) * 0.38, zt - (zt + CRUST) * 0.62, camera)
                : null;
            return (
              <Group key={item.key}>
                {leftFace ? <Path path={leftFace} color={tile.kind === 'water' ? faces.left : palette.dirtLeft} /> : null}
                {rightFace ? <Path path={rightFace} color={tile.kind === 'water' ? faces.right : palette.dirtRight} /> : null}
                {stone ? <Path path={stone} color={palette.stone} opacity={0.78} /> : null}
                <Path path={diamondPath(item.x, item.y, zt, camera)} color={lid} />
                {tile.kind !== 'water' && (item.x + item.y) % 2 === 0 ? (
                  <Path path={diamondPath(item.x, item.y, zt, camera)} color={shade(lid, -0.04)} />
                ) : null}
                {tile.worn > 0 ? (
                  <Path path={diamondPath(item.x, item.y, zt, camera)} color={withAlpha(palette.sand, tile.worn)} />
                ) : null}
              </Group>
            );
          }
          if (item.kind === 'tree') {
            const tree = world.trees[item.index];
            return (
              <GroveTreeSprite
                key={item.key}
                tree={tree}
                z={world.tiles[tree.y][tree.x].height}
                camera={camera}
                time={time}
                leaf={palette.leaf}
                leafDark={palette.leafDark}
                bark={palette.bark}
                snowy={world.season === 'winter'}
              />
            );
          }
          if (item.kind === 'tuft') {
            const tuft = world.tufts[item.index];
            return (
              <GroveTuftSprite
                key={item.key}
                tuft={tuft}
                z={world.tiles[tuft.y][tuft.x].height}
                camera={camera}
                time={time}
                color={shade(palette.leafDark, -0.08)}
                winter={world.season === 'winter'}
              />
            );
          }
          if (item.kind === 'ember') {
            return (
              <EmberMote
                key={item.key}
                x={world.egg.x}
                y={world.egg.y}
                z={eggTile.height}
                camera={camera}
                progress={progressSV}
                focusing={focusingSV}
                time={time}
              />
            );
          }
          if (item.kind === 'egg') {
            return (
              <GroveEgg
                key={item.key}
                x={world.egg.x}
                y={world.egg.y}
                z={eggTile.height}
                camera={camera}
                time={time}
                progress={progressSV}
                focusing={focusingSV}
              />
            );
          }
          return (
            <GroveCreatureSprite
              key={item.key}
              creature={world.creature}
              homeZ={creatureHome.height}
              destZ={creatureDest.height}
              camera={camera}
              time={time}
            />
          );
        })}
        {waterTiles.map((tile) => (
          <WaterGlint
            key={`g-${tile.x}-${tile.y}`}
            x={tile.x}
            y={tile.y}
            camera={camera}
            time={time}
            phase={tile.x * 0.8 + tile.y * 0.55}
          />
        ))}
      </Canvas>
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
  },
  groundShadow: {
    position: 'absolute',
    bottom: 18,
    width: 260,
    height: 44,
    borderRadius: 22,
  },
});
