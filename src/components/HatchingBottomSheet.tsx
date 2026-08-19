import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FOCUS_TAGS, LAND_CATALOG, SPECIES_CATALOG } from '../data/species';
import { colors, radii, shadows, spacing, type, TagKey } from '../theme';
import { DragonSpecies, LandStyleKey, TagInfo } from '../types';
import { SunnyMeadowThumbnail, TerracedGroveThumbnail } from './grove/LandThumbnails';

export interface HatchingBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedSpeciesId: string;
  onSelectSpecies: (species: DragonSpecies) => void;
  selectedDuration: number;
  onSelectDuration: (mins: number) => void;
  selectedTag: TagKey;
  onSelectTag: (tag: TagKey) => void;
  onConfirmHatch: (species: DragonSpecies, duration: number, tag: TagKey) => void;
  selectedLandStyle?: LandStyleKey;
  onSelectLandStyle?: (style: LandStyleKey) => void;
}

const DURATION_LIST = [10, 15, 20, 25, 30, 35, 45, 60, 90, 120, 180];

export function HatchingBottomSheet({
  visible,
  onClose,
  selectedSpeciesId,
  onSelectSpecies,
  selectedDuration,
  onSelectDuration,
  selectedTag,
  onSelectTag,
  onConfirmHatch,
  selectedLandStyle = 'sunny_meadow',
  onSelectLandStyle,
}: HatchingBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'planting' | 'land'>('planting');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['dragon_egg', 'emberwing', 'baby_sky_drake']));
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dragon' | 'plant'>('all');

  const selectedSpecies = useMemo(
    () => SPECIES_CATALOG.find((s) => s.id === selectedSpeciesId) ?? SPECIES_CATALOG[0],
    [selectedSpeciesId]
  );

  // Dragons & Plants for the planting grid
  const displayedSpecies = useMemo(() => {
    let list = SPECIES_CATALOG;
    if (categoryFilter !== 'all') {
      list = list.filter((s) => s.category === categoryFilter);
    }
    return list;
  }, [categoryFilter]);

  const toggleFavorite = (id: string) => {
    Haptics.selectionAsync();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isCurrentFavorite = favorites.has(selectedSpecies.id);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirmHatch(selectedSpecies, selectedDuration, selectedTag);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Top Handle Bar */}
          <View style={styles.handleBar} />

          {/* Top Segmented Tab Switcher (Planting Settings | Land) */}
          <View style={styles.tabBarWrap}>
            <View style={styles.tabPillContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('planting');
                }}
                style={[styles.tabButton, activeTab === 'planting' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, activeTab === 'planting' && styles.tabButtonTextActive]}>
                  🌱 Planting Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('land');
                }}
                style={[styles.tabButton, activeTab === 'land' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, activeTab === 'land' && styles.tabButtonTextActive]}>
                  🏝️ Land
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'planting' ? (
              <>
                {/* Category / Filter Header */}
                <View style={styles.sectionHeaderRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryFilter((prev) =>
                        prev === 'all' ? 'dragon' : prev === 'dragon' ? 'plant' : 'all'
                      );
                    }}
                    style={styles.dropdownHeaderBtn}
                  >
                    <Text style={styles.dropdownHeaderText}>
                      {categoryFilter === 'dragon'
                        ? 'Dragons (Recently unlocked)'
                        : categoryFilter === 'plant'
                          ? 'Trees & Flora'
                          : 'Dragons & Trees (Recently unlocked)'}
                    </Text>
                    <Text style={styles.dropdownChevron}>⌄</Text>
                  </TouchableOpacity>
                </View>

                {/* Species Grid (5 Columns - Dragons and Plants) */}
                <View style={styles.speciesGrid}>
                  {displayedSpecies.map((species) => {
                    const isSelected = species.id === selectedSpecies.id;
                    return (
                      <TouchableOpacity
                        key={species.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          Haptics.selectionAsync();
                          onSelectSpecies(species);
                        }}
                        style={[styles.speciesCell, isSelected && styles.speciesCellSelected]}
                      >
                        {/* VIP Crown Badge */}
                        {species.isVip && (
                          <View style={styles.crownBadge}>
                            <Text style={styles.crownIcon}>👑</Text>
                          </View>
                        )}

                        {/* Species Avatar */}
                        {species.image ? (
                          <Image source={species.image} style={styles.speciesImage} resizeMode="contain" />
                        ) : (
                          <View style={[styles.speciesEmojiCircle, { backgroundColor: species.color + '25' }]}>
                            <Text style={styles.speciesEmoji}>{species.icon}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Focused Time Section */}
                <View style={styles.timeSection}>
                  <Text style={styles.sectionTitle}>Focused Time</Text>

                  {/* Sprout & Dot Tick Ruler */}
                  <View style={styles.rulerContainer}>
                    <View style={styles.rulerSproutWrap}>
                      <Text style={styles.rulerSprout}>🌱</Text>
                    </View>
                    <View style={styles.rulerDotsRow}>
                      {Array.from({ length: 28 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.rulerDot,
                            i % 4 === 0 && styles.rulerDotMajor,
                            i === 14 && styles.rulerDotCenter,
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Time Preset Horizontal Carousel */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timePresetsRow}
                  >
                    {DURATION_LIST.map((mins) => {
                      const isSelected = mins === selectedDuration;
                      return (
                        <TouchableOpacity
                          key={mins}
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.selectionAsync();
                            onSelectDuration(mins);
                          }}
                          style={[styles.timePresetBtn, isSelected && styles.timePresetBtnSelected]}
                        >
                          <Text style={[styles.timePresetText, isSelected && styles.timePresetTextSelected]}>
                            {mins}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Tags Section */}
                <View style={styles.tagsSection}>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsScrollRow}
                  >
                    {/* Add Tag Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Haptics.selectionAsync()}
                      style={styles.addTagBtn}
                    >
                      <Text style={styles.addTagBtnText}>+</Text>
                    </TouchableOpacity>

                    {/* Default Unset Tag */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSelectTag('work');
                      }}
                      style={[styles.tagPill, selectedTag === 'work' && styles.tagPillSelected]}
                    >
                      <View style={[styles.tagDot, { backgroundColor: colors.tags.work }]} />
                      <Text style={[styles.tagPillText, selectedTag === 'work' && styles.tagPillTextSelected]}>
                        None
                      </Text>
                    </TouchableOpacity>

                    {/* Tag Options List */}
                    {FOCUS_TAGS.map((tag) => {
                      const isSelected = tag.key === selectedTag;
                      return (
                        <TouchableOpacity
                          key={tag.key}
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.selectionAsync();
                            onSelectTag(tag.key);
                          }}
                          style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                        >
                          <View style={[styles.tagDot, { backgroundColor: colors.tags[tag.key] }]} />
                          <Text style={[styles.tagPillText, isSelected && styles.tagPillTextSelected]}>
                            {tag.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            ) : (
              /* ========================================================
                 LAND TAB: Biome / Floating Island Selection Cards
                 ======================================================== */
              <View style={styles.landTabContent}>
                <View style={styles.landHeaderWrap}>
                  <Text style={styles.landHeaderTitle}>Choose Floating Island</Text>
                  <Text style={styles.landHeaderSubtitle}>
                    Select the environment stage where your dragon will hatch and grow
                  </Text>
                </View>

                {LAND_CATALOG.map((land) => {
                  const isSelected = selectedLandStyle === land.id;
                  return (
                    <TouchableOpacity
                      key={land.id}
                      activeOpacity={0.82}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSelectLandStyle?.(land.id);
                      }}
                      style={[styles.landCard, isSelected && styles.landCardSelected]}
                    >
                      {/* Left: 3D Isometric Miniature Island Thumbnail */}
                      <View style={[styles.landThumbnailWrap, isSelected && styles.landThumbnailWrapSelected]}>
                        {land.id === 'sunny_meadow' ? (
                          <SunnyMeadowThumbnail size={54} />
                        ) : (
                          <TerracedGroveThumbnail size={54} />
                        )}
                      </View>

                      {/* Middle: Details */}
                      <View style={styles.landInfoCol}>
                        <View style={styles.landNameRow}>
                          <Text style={styles.landNameText}>{land.name}</Text>
                          {isSelected && (
                            <View style={styles.landActiveBadge}>
                              <Text style={styles.landActiveBadgeText}>✓ Active</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.landSubtitleText}>{land.subtitle}</Text>
                        <Text style={styles.landDescText} numberOfLines={2}>
                          {land.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Floating Bottom Action Bar */}
          <View style={styles.bottomBar}>
            {/* Heart Favorite Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleFavorite(selectedSpecies.id)}
              style={styles.heartBtn}
            >
              <Text style={styles.heartIcon}>{isCurrentFavorite ? '❤️' : '♡'}</Text>
            </TouchableOpacity>

            {/* Selected Dragon Summary Avatar & Metadata */}
            <View style={styles.summaryWrap}>
              <View style={styles.summaryAvatarCircle}>
                {selectedSpecies.image ? (
                  <Image source={selectedSpecies.image} style={styles.summaryAvatarImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.summaryAvatarEmoji}>{selectedSpecies.icon}</Text>
                )}
              </View>

              <View style={styles.summaryMetaCol}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryHourglass}>⌛</Text>
                  <Text style={styles.summaryTimeText}>{selectedDuration} mins</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryTagDot, { backgroundColor: colors.tags[selectedTag] }]} />
                  <Text style={styles.summaryTagText}>
                    {FOCUS_TAGS.find((t) => t.key === selectedTag)?.label ?? 'Work'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Primary Plant / Hatch Action Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleConfirm} style={styles.plantBtn}>
              <Text style={styles.plantBtnText}>Plant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F5F7F6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1DBD7',
    alignSelf: 'center',
    marginBottom: 8,
  },
  tabBarWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4ECE9',
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: { elevation: 2 },
    }),
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#65877E',
  },
  tabButtonTextActive: {
    color: '#274C40',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dropdownHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#274C40',
  },
  dropdownChevron: {
    fontSize: 14,
    color: '#4B7367',
    marginTop: -2,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'flex-start',
  },
  speciesCell: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  speciesCellSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#52C59F',
    ...Platform.select({
      ios: { shadowColor: '#2B6E57', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 5 },
      default: { elevation: 3 },
    }),
  },
  speciesImage: {
    width: '78%',
    height: '78%',
  },
  speciesEmojiCircle: {
    width: '78%',
    height: '78%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speciesEmoji: {
    fontSize: 26,
  },
  crownBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#00E5C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  crownIcon: {
    fontSize: 10,
  },

  // Time Section
  timeSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#274C40',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  rulerContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  rulerSproutWrap: {
    marginBottom: 2,
  },
  rulerSprout: {
    fontSize: 16,
  },
  rulerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 20,
  },
  rulerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCD7D3',
  },
  rulerDotMajor: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9FB5AE',
  },
  rulerDotCenter: {
    backgroundColor: '#52C59F',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Time Presets
  timePresetsRow: {
    paddingHorizontal: 20,
    gap: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timePresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePresetBtnSelected: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3 },
      default: { elevation: 2 },
    }),
  },
  timePresetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#65877E',
  },
  timePresetTextSelected: {
    color: '#274C40',
    fontWeight: '700',
    fontSize: 16.5,
  },

  // Tags Section
  tagsSection: {
    marginTop: 14,
  },
  tagsScrollRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  addTagBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E4ECE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: {
    fontSize: 20,
    color: '#6A8C83',
    fontWeight: '500',
    marginTop: -2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4ECE9',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    gap: 6,
  },
  tagPillSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#52C59F',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      default: { elevation: 2 },
    }),
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#52756C',
  },
  tagPillTextSelected: {
    color: '#274C40',
    fontWeight: '700',
  },

  // Land Tab Cards
  landTabContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 14,
  },
  landHeaderWrap: {
    marginBottom: 4,
  },
  landHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#274C40',
    marginBottom: 3,
  },
  landHeaderSubtitle: {
    fontSize: 13,
    color: '#65877E',
    lineHeight: 18,
  },
  landCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      default: { elevation: 2 },
    }),
  },
  landCardSelected: {
    borderColor: '#52C59F',
    backgroundColor: '#FAFCFB',
    ...Platform.select({
      ios: { shadowColor: '#2B6E57', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8 },
      default: { elevation: 4 },
    }),
  },
  landThumbnailWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#F0F5F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landThumbnailWrapSelected: {
    backgroundColor: '#E8F5F0',
  },
  landInfoCol: {
    flex: 1,
  },
  landNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  landNameText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#274C40',
  },
  landActiveBadge: {
    backgroundColor: '#52C59F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  landActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  landSubtitleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5EA679',
    marginBottom: 4,
  },
  landDescText: {
    fontSize: 12,
    color: '#6F8C83',
    lineHeight: 16,
  },

  // Floating Bottom Action Bar
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: '#6F9188',
  },
  summaryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryAvatarImage: {
    width: 32,
    height: 32,
  },
  summaryAvatarEmoji: {
    fontSize: 24,
  },
  summaryMetaCol: {
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryHourglass: {
    fontSize: 12,
  },
  summaryTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#274C40',
  },
  summaryTagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  summaryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D8075',
  },
  plantBtn: {
    backgroundColor: '#52C59F',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#2B6E57', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
      default: { elevation: 3 },
    }),
  },
  plantBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
