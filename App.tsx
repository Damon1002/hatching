import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CubeLand3DView } from './src/components/CubeLand3DView';
import { AMBIENT_QUOTES } from './src/data/quotes';
import { FOCUS_TAGS, SPECIES_CATALOG } from './src/data/species';
import { colors, radii, shadows, spacing, type, TagKey } from './src/theme';
import { DailyGroveItem, DragonSpecies, FocusMode, SessionRecord, TagInfo } from './src/types';

const SESSION_SECONDS_PER_MINUTE = __DEV__ ? 1 : 60;
const DURATION_PRESETS = [10, 15, 20, 25, 30, 45, 60, 90, 120];

export default function App() {
  return (
    <SafeAreaProvider>
      <ForestHomeScreen />
    </SafeAreaProvider>
  );
}

function ForestHomeScreen() {
  // Focus state
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [selectedTag, setSelectedTag] = useState<TagKey>('work');
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [coins, setCoins] = useState(306);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(10);
  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(10 * SESSION_SECONDS_PER_MINUTE);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Modals & Drawers
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeTag = useMemo(
    () => FOCUS_TAGS.find((t) => t.key === selectedTag) || FOCUS_TAGS[0],
    [selectedTag]
  );

  // Synchronize timer duration changes
  const setDuration = (mins: number) => {
    if (running) return;
    setDurationMinutes(mins);
    setRemainingSeconds(mins * SESSION_SECONDS_PER_MINUTE);
    setShowTimeModal(false);
    Haptics.selectionAsync();
  };

  // Timer loop
  useEffect(() => {
    if (!running) return;
    if (remainingSeconds <= 0) {
      // Completed focus session
      setRunning(false);
      setTodayFocusMinutes((prev) => prev + durationMinutes);
      setCoins((prev) => prev + Math.floor(durationMinutes * 1.5));
      setToast(`✨ 专注成功！获得 ${Math.floor(durationMinutes * 1.5)} 灵晶，飞龙蛋已吸收心流能量！`);
      setRemainingSeconds(durationMinutes * SESSION_SECONDS_PER_MINUTE);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const interval = setTimeout(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(interval);
  }, [durationMinutes, remainingSeconds, running]);

  // Rotate quotes during focus
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % AMBIENT_QUOTES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [running]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemainingSeconds(durationMinutes * SESSION_SECONDS_PER_MINUTE);
    setRunning(true);
  };

  const handleGiveUpConfirm = () => {
    setShowGiveUpModal(false);
    setRunning(false);
    setRemainingSeconds(durationMinutes * SESSION_SECONDS_PER_MINUTE);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToast('本次专注已结束，飞龙蛋在静候你的下次守护。');
  };

  // Time text calculations
  const displaySeconds = __DEV__ ? remainingSeconds * 60 : remainingSeconds;
  const mins = Math.floor(displaySeconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(displaySeconds % 60).toString().padStart(2, '0');
  const progress = running ? 1 - remainingSeconds / (durationMinutes * SESSION_SECONDS_PER_MINUTE) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.forestBgTop, colors.forestBg, colors.forestBgBottom]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ==========================================
            1. TOP NAVIGATION BAR (Exact Forest Match)
           ========================================== */}
        <View style={styles.topBar}>
          {/* Left Actions: Hamburger Menu & Crown Badge */}
          <View style={styles.topBarLeft}>
            <PressableScale
              onPress={() => {
                Haptics.selectionAsync();
                setShowMenuDrawer(true);
              }}
              style={styles.iconBtn}
              accessibilityLabel="Menu"
            >
              <View style={styles.hamburgerIcon}>
                <View style={styles.hamburgerBar} />
                <View style={styles.hamburgerBar} />
                <View style={styles.hamburgerBar} />
                <View style={styles.notificationDot} />
              </View>
            </PressableScale>

            <PressableScale
              onPress={() => {
                Haptics.selectionAsync();
                setToast('👑 守护者特权：解锁全部传奇龙蛋与白噪音');
              }}
              style={styles.crownBadge}
              accessibilityLabel="Crown VIP"
            >
              <LinearGradient
                colors={['#38EF7D', '#11998E']}
                style={styles.crownInner}
              >
                <Text style={styles.crownText}>👑</Text>
              </LinearGradient>
            </PressableScale>
          </View>

          {/* Center: Mode Switcher (Hourglass / Strict Flame) */}
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              onPress={() => {
                if (running) return;
                setMode('timer');
                Haptics.selectionAsync();
              }}
              style={[styles.modeTab, mode === 'timer' && styles.modeTabActive]}
            >
              <Text style={styles.modeIcon}>⌛</Text>
            </TouchableOpacity>
            <View style={styles.modeDivider} />
            <TouchableOpacity
              onPress={() => {
                if (running) return;
                setMode('stopwatch');
                Haptics.selectionAsync();
              }}
              style={[styles.modeTab, mode === 'stopwatch' && styles.modeTabActive]}
            >
              <Text style={styles.modeIcon}>🔥</Text>
            </TouchableOpacity>
          </View>

          {/* Right: Golden Coin Pill */}
          <PressableScale
            onPress={() => {
              Haptics.selectionAsync();
              setToast(`🪙 灵晶余额：${coins}（完成专注即可获得更多）`);
            }}
            style={styles.coinPill}
          >
            <View style={styles.coinDot}>
              <Text style={styles.coinEmoji}>🟡</Text>
            </View>
            <Text style={styles.coinCount}>{coins}</Text>
            <Text style={styles.coinPlus}>+</Text>
          </PressableScale>
        </View>

        {/* Floating Sound / Species Quick Button (Below Top Right) */}
        <View style={styles.subActionRow}>
          <PressableScale
            onPress={() => {
              Haptics.selectionAsync();
              setSoundEnabled(!soundEnabled);
              setToast(soundEnabled ? '🔇 环境白噪音已关闭' : '🌧️ 已开启雨夜与微风白噪音');
            }}
            style={[styles.floatingCircleBtn, soundEnabled && styles.floatingCircleBtnActive]}
          >
            <Text style={styles.floatingCircleBtnText}>{soundEnabled ? '🌧️' : '🌱'}</Text>
          </PressableScale>
        </View>

        {/* ==========================================
            2. DAILY FOCUS GREETING / RUNNING QUOTE
           ========================================== */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>
            {running
              ? AMBIENT_QUOTES[quoteIndex]
              : `You have focused\nfor ${todayFocusMinutes} mins today.`}
          </Text>
        </View>

        {/* ==========================================
            3. CENTER HERO: EXACT BLENDER 3D MODEL (cube-land.glb)
           ========================================== */}
        <View style={styles.centerHeroWrap}>
          <CubeLand3DView isFocusing={running} progress={progress} />
        </View>

        {/* ==========================================
            4. TAG SELECTOR PILL (e.g. 🔴 Work)
           ========================================== */}
        <View style={styles.tagWrap}>
          <PressableScale
            disabled={running}
            onPress={() => {
              Haptics.selectionAsync();
              setShowTagModal(true);
            }}
            style={styles.tagPill}
          >
            <View style={[styles.tagColorDot, { backgroundColor: colors.tags[selectedTag] }]} />
            <Text style={styles.tagLabel}>{activeTag.label}</Text>
          </PressableScale>
        </View>

        {/* ==========================================
            5. LARGE CLEAN TIME DISPLAY (10:00)
           ========================================== */}
        <Pressable
          disabled={running}
          onPress={() => {
            Haptics.selectionAsync();
            setShowTimeModal(true);
          }}
          style={styles.timeWrap}
        >
          <Text style={styles.timeText}>
            {mins}:{secs}
          </Text>
        </Pressable>

        {/* ==========================================
            6. PLANT / HATCH / GIVE UP BUTTON
           ========================================== */}
        <View style={styles.actionWrap}>
          {!running ? (
            <PressableScale onPress={handleStart} style={styles.plantBtn}>
              <Text style={styles.plantBtnText}>Plant</Text>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => setShowGiveUpModal(true)}
              style={styles.giveUpBtn}
            >
              <Text style={styles.giveUpBtnText}>Give up</Text>
            </PressableScale>
          )}
        </View>
      </SafeAreaView>

      {/* ==========================================
          MODAL 1: TAG SELECTOR (Forest Style)
         ========================================== */}
      <Modal visible={showTagModal} transparent animationType="fade">
        <Pressable onPress={() => setShowTagModal(false)} style={styles.modalBackdrop}>
          <BlurView intensity={70} tint="dark" style={styles.tagModalContent}>
            <Text style={styles.modalHeaderTitle}>选择专注标签</Text>
            <View style={styles.tagListGrid}>
              {FOCUS_TAGS.map((tag) => {
                const isSelected = tag.key === selectedTag;
                const dotColor = colors.tags[tag.key];
                return (
                  <TouchableOpacity
                    key={tag.key}
                    onPress={() => {
                      setSelectedTag(tag.key);
                      setShowTagModal(false);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.tagOptionItem, isSelected && styles.tagOptionItemSelected]}
                  >
                    <View style={[styles.tagColorDotLarge, { backgroundColor: dotColor }]} />
                    <Text style={styles.tagOptionEmoji}>{tag.emoji}</Text>
                    <Text style={[styles.tagOptionText, isSelected && styles.tagOptionTextSelected]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </Pressable>
      </Modal>

      {/* ==========================================
          MODAL 2: DURATION PRESET PICKER
         ========================================== */}
      <Modal visible={showTimeModal} transparent animationType="fade">
        <Pressable onPress={() => setShowTimeModal(false)} style={styles.modalBackdrop}>
          <BlurView intensity={70} tint="dark" style={styles.timeModalContent}>
            <Text style={styles.modalHeaderTitle}>调整专注时长 (分钟)</Text>
            <View style={styles.presetGrid}>
              {DURATION_PRESETS.map((min) => {
                const isSelected = durationMinutes === min;
                return (
                  <TouchableOpacity
                    key={min}
                    onPress={() => setDuration(min)}
                    style={[styles.presetTile, isSelected && styles.presetTileSelected]}
                  >
                    <Text style={[styles.presetTileText, isSelected && styles.presetTileTextSelected]}>
                      {min}
                    </Text>
                    <Text style={styles.presetTileSub}>mins</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </Pressable>
      </Modal>

      {/* ==========================================
          MODAL 3: GENTLE GIVE UP PROMPT
         ========================================== */}
      <Modal visible={showGiveUpModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <BlurView intensity={75} tint="dark" style={styles.giveUpModalBox}>
            <Text style={styles.giveUpEmoji}>🌱</Text>
            <Text style={styles.giveUpTitle}>确定要放弃吗？</Text>
            <Text style={styles.giveUpBody}>
              如果现在放弃，飞龙蛋将暂停孵化，但不会枯萎或受损。随时可以温柔地重新开始。
            </Text>
            <View style={styles.giveUpActions}>
              <TouchableOpacity onPress={() => setShowGiveUpModal(false)} style={styles.giveUpCancelBtn}>
                <Text style={styles.giveUpCancelText}>继续专注</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGiveUpConfirm} style={styles.giveUpConfirmBtn}>
                <Text style={styles.giveUpConfirmText}>放弃本次</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ==========================================
          DRAWER: HAMBURGER MENU (Forest Style)
         ========================================== */}
      <Modal visible={showMenuDrawer} transparent animationType="slide">
        <View style={styles.drawerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMenuDrawer(false)} />
          <BlurView intensity={85} tint="dark" style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>DRAGON GROVE</Text>
              <Text style={styles.drawerSubtitle}>心流森林 · 飞龙圣所</Text>
            </View>

            <View style={styles.drawerMenu}>
              <DrawerItem
                icon="🌲"
                label="今日林地 (Forest)"
                onPress={() => {
                  setShowMenuDrawer(false);
                  setToast('🌲 今日已种植 1 棵灵木，守护 10 分钟');
                }}
              />
              <DrawerItem
                icon="📊"
                label="专注统计 (Chronicles)"
                onPress={() => {
                  setShowMenuDrawer(false);
                  setToast('📊 本周累计 22.9 小时，连续第 7 天专注');
                }}
              />
              <DrawerItem
                icon="🥚"
                label="龙蛋图鉴 (Codex)"
                onPress={() => {
                  setShowMenuDrawer(false);
                  setToast('🥚 当前已解锁 3 枚龙蛋，金杏灵龙蛋尚需 118 分钟');
                }}
              />
              <DrawerItem
                icon="⚙️"
                label="设置与声音 (Settings)"
                onPress={() => {
                  setShowMenuDrawer(false);
                  setToast('⚙️ 已启用触觉反馈与系统深色外观');
                }}
              />
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerVersion}>Forest Edition · 1.0.0</Text>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ==========================================
          TOAST FEEDBACK
         ========================================== */}
      {toast && (
        <Animated.View entering={FadeInUp.springify()} exiting={FadeOut.duration(200)} style={styles.toastWrap}>
          <BlurView intensity={80} tint="dark" style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

function DrawerItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
      <Text style={styles.drawerItemIcon}>{icon}</Text>
      <Text style={styles.drawerItemLabel}>{label}</Text>
      <Text style={styles.drawerItemArrow}>›</Text>
    </TouchableOpacity>
  );
}

function PressableScale({
  children,
  onPress,
  disabled,
  style,
  ...props
}: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (!disabled) scale.value = withSpring(0.95, { damping: 14, stiffness: 320 });
        }}
        onPressOut={() => {
          if (!disabled) scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        }}
        style={style}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ==========================================
// STYLES (Faithfully Matching Screenshot)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.forestBg,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? spacing.sm : 4,
    paddingHorizontal: 4,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  hamburgerBar: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textWhite,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5252',
  },
  crownBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#4EF0D2',
  },
  crownInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownText: {
    fontSize: 14,
  },

  // Mode Switcher (Hourglass / Flame)
  modeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  modeTab: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  modeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modeIcon: {
    fontSize: 15,
    color: colors.textWhite,
  },
  modeDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Coin Pill
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: radii.full,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    gap: 4,
  },
  coinDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5BE2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 12,
  },
  coinCount: {
    ...type.captionStrong,
    color: colors.textWhite,
    fontSize: 14,
  },
  coinPlus: {
    fontSize: 14,
    color: '#82C49B',
    fontWeight: '700',
    marginLeft: 2,
  },

  // Floating Sub-Action (Leaf button below top right)
  subActionRow: {
    alignItems: 'flex-end',
    paddingRight: 4,
    marginTop: -4,
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCircleBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  floatingCircleBtnText: {
    fontSize: 22,
  },

  // Greeting Text
  greetingWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    minHeight: 48,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 16.5,
    lineHeight: 23,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Center Hero Island
  centerHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },

  // Tag Pill (🔴 Work)
  tagWrap: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagColorDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  tagLabel: {
    ...type.captionStrong,
    color: colors.textWhite,
    fontSize: 14,
  },

  // Large Time Display
  timeWrap: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  timeText: {
    ...type.timerDisplay,
    color: colors.textWhite,
  },

  // Bottom Plant Button
  actionWrap: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  plantBtn: {
    width: 140,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.forestBtn,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.btn,
  },
  plantBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  giveUpBtn: {
    width: 140,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  giveUpBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },

  // Modals & Backdrops
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalHeaderTitle: {
    ...type.title,
    color: colors.textWhite,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tagModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(32, 65, 55, 0.94)',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagListGrid: {
    gap: spacing.xs,
  },
  tagOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing.sm,
  },
  tagOptionItemSelected: {
    backgroundColor: 'rgba(82, 197, 159, 0.3)',
    borderWidth: 1,
    borderColor: colors.forestBtn,
  },
  tagColorDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagOptionEmoji: {
    fontSize: 16,
  },
  tagOptionText: {
    ...type.body,
    color: colors.textWhite,
    flex: 1,
  },
  tagOptionTextSelected: {
    fontWeight: '700',
  },

  // Preset Time Modal
  timeModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(32, 65, 55, 0.94)',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetTile: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  presetTileSelected: {
    backgroundColor: colors.forestBtn,
  },
  presetTileText: {
    ...type.title,
    color: colors.textWhite,
  },
  presetTileTextSelected: {
    fontWeight: '700',
  },
  presetTileSub: {
    ...type.micro,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Give Up Box
  giveUpModalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(32, 65, 55, 0.96)',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  giveUpEmoji: {
    fontSize: 34,
    marginBottom: spacing.xs,
  },
  giveUpTitle: {
    ...type.title,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  giveUpBody: {
    ...type.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  giveUpActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  giveUpCancelBtn: {
    flex: 1,
    backgroundColor: colors.forestBtn,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  giveUpCancelText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  giveUpConfirmBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  giveUpConfirmText: {
    ...type.bodyStrong,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Drawer
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawerContent: {
    width: '78%',
    height: '100%',
    backgroundColor: 'rgba(20, 48, 40, 0.96)',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  drawerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  drawerTitle: {
    ...type.title,
    color: colors.textWhite,
    letterSpacing: 1,
  },
  drawerSubtitle: {
    ...type.caption,
    color: '#82C49B',
    marginTop: 2,
  },
  drawerMenu: {
    gap: spacing.xs,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawerItemIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  drawerItemLabel: {
    ...type.body,
    color: colors.textWhite,
    flex: 1,
  },
  drawerItemArrow: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  drawerFooter: {
    marginTop: 'auto',
    marginBottom: 40,
    alignItems: 'center',
  },
  drawerVersion: {
    ...type.micro,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Toast
  toastWrap: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    backgroundColor: 'rgba(15, 38, 30, 0.95)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastText: {
    ...type.captionStrong,
    color: colors.textWhite,
    textAlign: 'center',
  },
});
