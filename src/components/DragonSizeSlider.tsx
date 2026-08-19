import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, radii, type } from '../theme';

export const DRAGON_SIZE_MIN = 0.25;
export const DRAGON_SIZE_MAX = 1.4;
export const DRAGON_SIZE_DEFAULT = 0.25;

export function DragonSizeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const pageXRef = useRef(0);
  const widthRef = useRef(1);
  const lastTick = useRef(Math.round(value * 20));
  const t = (value - DRAGON_SIZE_MIN) / (DRAGON_SIZE_MAX - DRAGON_SIZE_MIN);

  const applyPageX = (pageX: number) => {
    const nextT = Math.max(0, Math.min(1, (pageX - pageXRef.current) / widthRef.current));
    const next = DRAGON_SIZE_MIN + nextT * (DRAGON_SIZE_MAX - DRAGON_SIZE_MIN);
    const tick = Math.round(next * 20);
    if (tick !== lastTick.current) {
      lastTick.current = tick;
      Haptics.selectionAsync();
    }
    onChange(next);
  };

  const measureAndApply = (pageX: number) => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      pageXRef.current = x;
      widthRef.current = Math.max(1, w);
      applyPageX(pageX);
    });
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole="adjustable"
      accessibilityLabel="Baby dragon size"
      accessibilityValue={{ text: `${Math.round(value * 100)} percent` }}
    >
      <Text style={styles.label}>Size</Text>
      <View
        ref={trackRef}
        style={styles.trackHit}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => measureAndApply(event.nativeEvent.pageX)}
        onResponderMove={(event) => applyPageX(event.nativeEvent.pageX)}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, t)) * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${Math.max(0, Math.min(1, t)) * 100}%` }]} />
      </View>
      <Text style={styles.value}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  label: {
    ...type.captionStrong,
    color: colors.textWhite,
    fontSize: 13,
  },
  trackHit: {
    width: 168,
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(70, 143, 123, 0.35)',
  },
  value: {
    ...type.captionStrong,
    color: colors.textWhite,
    fontSize: 13,
    minWidth: 42,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
