import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { notesAPI, reviewsAPI, usersAPI } from '../services/api';
import { formatRelativeDate, formatUTCToLocalTime } from '../utils/timezone';
import { theme, elevation } from '../theme';
import { AnimatedCard } from '../components/ui';

const { width } = Dimensions.get('window');

type TabType = 'notes' | 'reviews';

const JournalScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [notes, setNotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations on focus
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      scaleAnim.setValue(0.95);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, [])
  );

  useEffect(() => {
    loadData();
    if (activeTab === 'reviews') {
      loadSchedule();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'notes') {
        await loadNotes();
      } else {
        await loadReviews();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const notesData = await notesAPI.getNotesRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
  };

  const loadReviews = async () => {
    try {
      const reviewsData = await reviewsAPI.getReviewHistory(0, 50);
      // Filter out empty or invalid reviews
      const validReviews = (reviewsData || []).filter(
        (review: any) => {
          if (!review) return false;
          // Check for old format fields
          if (review.summary || review.key_topics || review.achievements) return true;
          // Check for new format with content field
          if (review.content) {
            return review.content.day_overview || review.content.week_summary || review.content.achievements;
          }
          return false;
        }
      );
      setReviews(validReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadSchedule = async () => {
    try {
      const data = await usersAPI.getReviewSchedule();
      setScheduleData(data);
      
      if (data.time_utc) {
        // Convert UTC time to local time for display
        const [hours, minutes] = data.time_utc.split(':').map(Number);
        const localTime = new Date();
        localTime.setHours(hours, minutes, 0, 0);
        setSelectedTime(localTime);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleUpdateSchedule = async () => {
    setIsUpdatingSchedule(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      
      await usersAPI.updateReviewSchedule({
        time: timeString,
        timezone: timezone
      });
      
      await loadSchedule();
      
      Alert.alert(
        'Schedule Updated',
        `Your daily review is now scheduled for ${formatTime(selectedTime)}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update schedule',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const onTimeChange = (hours: number, minutes: number) => {
    const newTime = new Date();
    newTime.setHours(hours, minutes, 0, 0);
    setSelectedTime(newTime);
    setShowTimePicker(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;
    
    // Animate tab switch
    Animated.timing(tabSlideAnim, {
      toValue: tab === 'notes' ? 0 : 1,
      duration: theme.animation.duration.fast,
      useNativeDriver: true,
    }).start();
    
    setActiveTab(tab);
  };

  const getNotePreview = (content: any) => {
    if (!content || typeof content !== 'string') {
      return 'No content available';
    }
    const plainText = content.replace(/[#*_`]/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const formatDate = (item: any) => {
    if (item.type === 'weekly') {
      return `Week of ${new Date(item.period_start).toLocaleDateString()}`;
    }
    return formatRelativeDate(item.date || item.review_date);
  };

  const formatTimestamp = (timestamp: string) => {
    return formatUTCToLocalTime(timestamp);
  };

  const renderNoteItem = ({ item, index }: { item: any; index: number }) => (
    <Pressable
      onPress={() => navigation.navigate('NoteDetail', { noteData: item })}
      style={{ marginBottom: theme.spacing.md }}
    >
      <AnimatedCard
        variant="elevated"
        animationType="slide"
        delay={index * 50}
        style={styles.noteCard}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {formatRelativeDate(item.date || item.created_at)}
            </Text>
            <Text style={styles.noteTime}>
              {formatTimestamp(item.created_at)}
            </Text>
            {item.content && item.content !== '' && (
              <Text style={styles.notePreview} numberOfLines={2}>
                {getNotePreview(item.content)}
              </Text>
            )}
          </View>
          <View style={styles.noteChevron}>
            <Svg width="16" height="16" viewBox="0 0 24 24">
              <Path
                d="M9 18l6-6-6-6"
                stroke={theme.colors.text.light}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {item.tags.slice(0, 3).map((tag: string, idx: number) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </AnimatedCard>
    </Pressable>
  );

  const renderReviewItem = ({ item, index }: { item: any; index: number }) => {
    const sentimentColors: Record<string, string> = {
      // Old format
      positive: theme.colors.success,
      negative: theme.colors.error,
      neutral: theme.colors.secondary,
      mixed: theme.colors.warning,
      // New emotional colors
      energized: '#FFB84D',
      happy: theme.colors.success,
      content: '#7DC383',
      calm: '#98A1BC',
      focused: '#6B8EE5',
      anxious: theme.colors.warning,
      stressed: '#FF8A80',
      sad: '#9E9E9E',
      frustrated: theme.colors.error,
      tired: '#B8BFD0'
    };
    
    // Get sentiment from content.emotional_color or fallback to old format
    const sentiment = item.content?.emotional_color || item.sentiment || 'neutral';
    const color = sentimentColors[sentiment.toLowerCase()] || theme.colors.secondary;
    
    // Get summary text from new or old format
    const summaryText = item.content?.day_overview || item.content?.week_summary || item.summary;

    return (
      <Pressable
        onPress={() => navigation.navigate('ReviewDetail', { reviewData: item })}
        style={{ marginBottom: theme.spacing.md }}
      >
        <AnimatedCard
          variant="elevated"
          animationType="slide"
          delay={index * 50}
          style={[styles.reviewCard, { borderWidth: 2, borderColor: color, borderLeftWidth: 4 }]}
        >
          <View style={styles.reviewContent}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewTitle}>
                  {item.type === 'weekly' ? 'Weekly Review' : 'Daily Review'}
                </Text>
                <Text style={styles.reviewDate}>{formatDate(item)}</Text>
              </View>
              <View style={[styles.sentimentBadge, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.sentimentText, { color }]}>
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </Text>
              </View>
            </View>
            {summaryText && (
              <Text style={styles.reviewSummary} numberOfLines={2}>
                {summaryText}
              </Text>
            )}
          </View>
        </AnimatedCard>
      </Pressable>
    );
  };

  const EmptyState = ({ type }: { type: TabType }) => (
    <View style={styles.emptyContainer}>
      <AnimatedCard variant="flat" style={styles.emptyCard}>
        {type === 'notes' && (
          <Text style={styles.emptyIcon}>📝</Text>
        )}
        <Text style={styles.emptyTitle}>
          No {type === 'notes' ? 'Notes' : 'Reviews'} Yet
        </Text>
        <Text style={styles.emptyText}>
          {type === 'notes' 
            ? 'Start recording to create your first note'
            : 'Your daily reviews will appear here'}
        </Text>
      </AnimatedCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.soft}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Journal</Text>
          
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <Animated.View 
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: tabSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, width / 2 - theme.spacing.lg]
                    })
                  }]
                }
              ]}
            />
            <Pressable 
              style={styles.tab}
              onPress={() => switchTab('notes')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'notes' && styles.tabTextActive
              ]}>
                Notes
              </Text>
            </Pressable>
            <Pressable 
              style={styles.tab}
              onPress={() => switchTab('reviews')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'reviews' && styles.tabTextActive
              ]}>
                Reviews
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={activeTab === 'notes' ? notes : reviews}
              renderItem={activeTab === 'notes' ? renderNoteItem : renderReviewItem}
              keyExtractor={(item) => item.id?.toString() || item.created_at}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                />
              }
              ListEmptyComponent={<EmptyState type={activeTab} />}
            />
          )}
        </Animated.View>

        {/* Review Schedule Section */}
        {activeTab === 'reviews' && !loading && (
          <Animated.View 
            style={[
              styles.scheduleContainer,
              { opacity: fadeAnim }
            ]}
          >
            <AnimatedCard variant="elevated" style={styles.scheduleCard}>
              <Text style={styles.scheduleTitle}>Daily Review Schedule</Text>
              
              {scheduleData?.scheduled && (
                <Text style={styles.currentSchedule}>
                  Currently scheduled for {formatTime(selectedTime)}
                </Text>
              )}
              
              <TouchableOpacity 
                onPress={() => setShowTimePicker(true)}
                style={styles.timeSelector}
              >
                <Text style={styles.timeSelectorText}>
                  {formatTime(selectedTime)}
                </Text>
                <Text style={styles.timeSelectorIcon}>⏰</Text>
              </TouchableOpacity>
              
              {/* Time Picker Modal */}
              <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.timePickerModal}>
                    <Text style={styles.modalTitle}>Select Time</Text>
                    
                    <View style={styles.timePickerContainer}>
                      <ScrollView 
                        style={styles.timePickerScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          const period = hour < 12 ? 'AM' : 'PM';
                          
                          return Array.from({ length: 4 }, (_, j) => j * 15).map(minute => (
                            <TouchableOpacity
                              key={`${hour}-${minute}`}
                              style={[
                                styles.timeOption,
                                selectedTime.getHours() === hour && 
                                selectedTime.getMinutes() === minute && 
                                styles.selectedTimeOption
                              ]}
                              onPress={() => onTimeChange(hour, minute)}
                            >
                              <Text style={[
                                styles.timeOptionText,
                                selectedTime.getHours() === hour && 
                                selectedTime.getMinutes() === minute && 
                                styles.selectedTimeText
                              ]}>
                                {`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`}
                              </Text>
                            </TouchableOpacity>
                          ));
                        })}
                      </ScrollView>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.modalCloseText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              
              <TouchableOpacity
                onPress={handleUpdateSchedule}
                disabled={isUpdatingSchedule}
                style={styles.updateButton}
              >
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.updateGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isUpdatingSchedule ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.updateText}>Update Schedule</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </AnimatedCard>
          </Animated.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    ...elevation(2),
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (width - theme.spacing.lg * 2 - 8) / 2,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  noteCard: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.text.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  noteTime: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  noteChevron: {
    marginLeft: theme.spacing.md,
  },
  notePreview: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  reviewCard: {
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  reviewTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  reviewDate: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  sentimentBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  sentimentText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  reviewSummary: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  scheduleContainer: {
    position: 'absolute',
    bottom: theme.spacing.xxl + 80,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  scheduleCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  currentSchedule: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    ...elevation(2),
  },
  timeSelectorText: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  timeSelectorIcon: {
    fontSize: 24,
  },
  updateButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...elevation(3),
  },
  updateGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  updateText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: width - theme.spacing.lg * 2,
    maxHeight: 500,
    ...elevation(5),
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  timePickerContainer: {
    maxHeight: 350,
  },
  timePickerScroll: {
    maxHeight: 350,
  },
  timeOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  selectedTimeOption: {
    backgroundColor: theme.colors.primary,
  },
  timeOptionText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedTimeText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
});

export default JournalScreen;