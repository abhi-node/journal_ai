import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { reviewsAPI } from '../services/api';
import { theme, elevation } from '../theme';
import { AnimatedCard } from '../components/ui';

const { width } = Dimensions.get('window');

type RouteParams = {
  ReviewDetail: {
    reviewId?: string;
    reviewData?: any;
  };
};

const ReviewDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ReviewDetail'>>();
  const [review, setReview] = useState<any>(route.params?.reviewData || null);
  const [loading, setLoading] = useState(!route.params?.reviewData);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    if (route.params?.reviewId && !route.params?.reviewData) {
      fetchReview();
    }
    
    // Entrance animations
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
  }, [route.params?.reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const data = await reviewsAPI.getReviewById(route.params?.reviewId || '');
      setReview(data);
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Date not available';
    }
    
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // If it's just a date (YYYY-MM-DD), treat it as local date
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEmotionalColorInfo = (emotionalColor: string) => {
    const emotionMap: { [key: string]: { label: string; color: string; gradient: string[]; icon: string } } = {
      'energized': { 
        label: 'Energized', 
        color: '#FFB84D', 
        gradient: ['#FFB84D', '#FF9F1C'],
        icon: '⚡' 
      },
      'happy': { 
        label: 'Happy', 
        color: theme.colors.success, 
        gradient: [theme.colors.success, '#4CAF50'],
        icon: '😊' 
      },
      'content': { 
        label: 'Content', 
        color: '#7DC383', 
        gradient: ['#7DC383', '#5FA365'],
        icon: '😌' 
      },
      'calm': { 
        label: 'Calm', 
        color: '#98A1BC', 
        gradient: ['#98A1BC', '#7A839E'],
        icon: '🧘' 
      },
      'focused': { 
        label: 'Focused', 
        color: '#6B8EE5', 
        gradient: ['#6B8EE5', '#4D70C7'],
        icon: '🎯' 
      },
      'anxious': { 
        label: 'Anxious', 
        color: theme.colors.warning, 
        gradient: [theme.colors.warning, '#FF9800'],
        icon: '😟' 
      },
      'stressed': { 
        label: 'Stressed', 
        color: '#FF8A80', 
        gradient: ['#FF8A80', '#FF6C62'],
        icon: '😣' 
      },
      'sad': { 
        label: 'Sad', 
        color: '#9E9E9E', 
        gradient: ['#9E9E9E', '#808080'],
        icon: '😢' 
      },
      'frustrated': { 
        label: 'Frustrated', 
        color: theme.colors.error, 
        gradient: [theme.colors.error, '#F44336'],
        icon: '😤' 
      },
      'tired': { 
        label: 'Tired', 
        color: '#B8BFD0', 
        gradient: ['#B8BFD0', '#9AA1B2'],
        icon: '😴' 
      },
      // Fallback for old format
      'positive': { 
        label: 'Positive', 
        color: theme.colors.success, 
        gradient: [theme.colors.success, '#4CAF50'],
        icon: '😊' 
      },
      'negative': { 
        label: 'Negative', 
        color: theme.colors.error, 
        gradient: [theme.colors.error, '#F44336'],
        icon: '😢' 
      },
      'neutral': { 
        label: 'Neutral', 
        color: theme.colors.secondary, 
        gradient: [theme.colors.secondary, '#9E9E9E'],
        icon: '😐' 
      },
    };
    return emotionMap[emotionalColor?.toLowerCase()] || emotionMap.neutral;
  };

  const renderProgressBar = (percent: number, color: string) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${percent}%`,
                backgroundColor: color 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
    );
  };

  const renderScoreCircle = (score: number, emotionColor: string) => {
    const radius = 60;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <View style={styles.scoreCircleContainer}>
        <Svg width={140} height={140}>
          <Circle
            cx="70"
            cy="70"
            r={radius}
            stroke={theme.colors.overlay}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx="70"
            cy="70"
            r={radius}
            stroke={emotionColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </Svg>
        <View style={styles.scoreCircleContent}>
          <Text style={[styles.scoreNumber, { color: emotionColor }]}>{score}</Text>
          <Text style={styles.scoreLabel}>Daily Score</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={theme.colors.gradients.soft}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!review) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={theme.colors.gradients.soft}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke={theme.colors.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Review not found</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Extract data from new or old format
  const emotionalColor = review.content?.emotional_color || review.sentiment || 'neutral';
  const emotionInfo = getEmotionalColorInfo(emotionalColor);
  const reviewScore = review.content?.score || review.score || review.mood_score || 0;
  
  // New format data
  const daySummary = review.content?.day_summary;
  const skillsPracticed = review.content?.skills_practiced;
  const growthAreas = review.content?.growth_areas;
  const tomorrowFocus = review.content?.tomorrow_focus;
  const dailyStats = review.content?.daily_stats;
  
  // Old format compatibility
  const achievements = review.content?.achievements || review.achievements || [];
  const dayOverview = review.content?.day_overview || review.summary;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.soft}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={theme.colors.text.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Review</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date */}
          <Text style={styles.dateText}>{formatDate(review.review_date || review.date)}</Text>

          {/* Score and Emotion Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }}
          >
            <AnimatedCard variant="elevated" style={styles.scoreCard}>
              <LinearGradient
                colors={emotionInfo.gradient}
                style={styles.scoreCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.scoreContent}>
                  {renderScoreCircle(reviewScore, emotionInfo.color)}
                  <View style={styles.emotionBadge}>
                    <Text style={styles.emotionIcon}>{emotionInfo.icon}</Text>
                    <Text style={styles.emotionLabel}>{emotionInfo.label}</Text>
                  </View>
                </View>
              </LinearGradient>
            </AnimatedCard>
          </Animated.View>

          {/* Daily Stats */}
          {dailyStats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dailyStats.total_xp || 0}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dailyStats.skills_improved || 0}</Text>
                <Text style={styles.statLabel}>Skills Practiced</Text>
              </View>
            </View>
          )}

          {/* Day Summary - New Format */}
          {daySummary && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              {daySummary.headline && (
                <Text style={styles.headline}>{daySummary.headline}</Text>
              )}
              {daySummary.key_moments && daySummary.key_moments.length > 0 && (
                <View style={styles.timelineContainer}>
                  {daySummary.key_moments.map((moment: string, index: number) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      {index < daySummary.key_moments.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <Text style={styles.timelineText}>{moment}</Text>
                    </View>
                  ))}
                </View>
              )}
            </AnimatedCard>
          )}

          {/* Fallback to old day overview if new format not present */}
          {!daySummary && dayOverview && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Day Overview</Text>
              <Text style={styles.overviewText}>{dayOverview}</Text>
            </AnimatedCard>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      fill={theme.colors.success}
                    />
                  </Svg>
                </View>
                <Text style={styles.sectionTitle}>Achievements</Text>
              </View>
              <View style={styles.achievementsList}>
                {achievements.map((achievement: string, index: number) => (
                  <View key={index} style={styles.achievementItem}>
                    <Svg width="16" height="16" viewBox="0 0 24 24">
                      <Path
                        d="M9 12l2 2 4-4"
                        stroke={theme.colors.success}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Skills Practiced - New Format */}
          {skillsPracticed && Object.keys(skillsPracticed).length > 0 && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              {Object.entries(skillsPracticed).map(([skillName, skillData]: [string, any]) => (
                <View key={skillName} style={styles.skillCard}>
                  <View style={styles.skillHeader}>
                    <Text style={styles.skillName}>{skillName}</Text>
                    <View style={styles.xpBadge}>
                      <Text style={styles.xpText}>+{skillData.xp_gained} XP</Text>
                    </View>
                  </View>
                  <Text style={styles.skillActivity}>{skillData.activities}</Text>
                  {skillData.level_progress && (
                    <View style={styles.levelProgressContainer}>
                      <Text style={styles.levelText}>
                        Level {skillData.level_progress.current}
                      </Text>
                      {renderProgressBar(
                        skillData.level_progress.progress_percent || 0,
                        theme.colors.primary
                      )}
                    </View>
                  )}
                </View>
              ))}
            </AnimatedCard>
          )}

          {/* Growth Areas */}
          {growthAreas && growthAreas.length > 0 && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      fill={theme.colors.warning}
                    />
                  </Svg>
                </View>
                <Text style={styles.sectionTitle}>Growth Areas</Text>
              </View>
              <View style={styles.growthList}>
                {growthAreas.map((area: string, index: number) => (
                  <View key={index} style={styles.growthItem}>
                    <View style={styles.growthDot} />
                    <Text style={styles.growthText}>{area}</Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Tomorrow's Focus */}
          {tomorrowFocus && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path
                      d="M7 10l5 5 5-5"
                      stroke={theme.colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      transform="rotate(270 12 12)"
                    />
                  </Svg>
                </View>
                <Text style={styles.sectionTitle}>Tomorrow's Focus</Text>
              </View>
              {tomorrowFocus.primary && (
                <View style={styles.primaryFocusCard}>
                  <Text style={styles.primaryFocusLabel}>Main Priority</Text>
                  <Text style={styles.primaryFocusText}>{tomorrowFocus.primary}</Text>
                </View>
              )}
              {tomorrowFocus.quick_wins && tomorrowFocus.quick_wins.length > 0 && (
                <View style={styles.quickWinsContainer}>
                  <Text style={styles.quickWinsLabel}>Quick Wins</Text>
                  {tomorrowFocus.quick_wins.map((win: string, index: number) => (
                    <View key={index} style={styles.quickWinItem}>
                      <View style={styles.quickWinNumber}>
                        <Text style={styles.quickWinNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.quickWinText}>{win}</Text>
                    </View>
                  ))}
                </View>
              )}
            </AnimatedCard>
          )}

          {/* Old format XP display for backward compatibility */}
          {!skillsPracticed && review.content?.xp_earned && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>XP Earned</Text>
              <View style={styles.xpGrid}>
                {Object.entries(review.content.xp_earned).map(([skill, xp]) => (
                  <View key={skill} style={styles.xpItem}>
                    <Text style={styles.xpSkillName}>{skill}</Text>
                    <Text style={styles.xpAmount}>+{xp as number} XP</Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation(2),
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  scoreCardGradient: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreCircleContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontFamily: theme.typography.fontFamily.bold,
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    opacity: 0.9,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.lg,
    ...elevation(2),
  },
  emotionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  emotionLabel: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...elevation(2),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.overlay,
    marginHorizontal: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  headline: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  timelineContainer: {
    marginTop: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 20,
    width: 2,
    height: 32,
    backgroundColor: theme.colors.overlay,
  },
  timelineText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  overviewText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  achievementsList: {
    marginTop: theme.spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  achievementText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  skillCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  skillName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  xpBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  xpText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.success,
  },
  skillActivity: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  levelProgressContainer: {
    marginTop: theme.spacing.sm,
  },
  levelText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.overlay,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    minWidth: 35,
  },
  growthList: {
    marginTop: theme.spacing.sm,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  growthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.warning,
    marginRight: theme.spacing.md,
    marginTop: 6,
  },
  growthText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  primaryFocusCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  primaryFocusLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  primaryFocusText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  quickWinsContainer: {
    marginTop: theme.spacing.md,
  },
  quickWinsLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  quickWinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickWinNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  quickWinNumberText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.primary,
  },
  quickWinText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  xpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  xpItem: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  xpSkillName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  xpAmount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.success,
  },
});

export default ReviewDetailScreen;