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
import Svg, { Path, Circle } from 'react-native-svg';
import { reviewsAPI } from '../services/api';
import { formatUTCToLocalDate } from '../utils/timezone';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
    const emotionMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'energized': { label: 'Energized', color: '#FFB84D', icon: '⚡' },
      'happy': { label: 'Happy', color: theme.colors.success, icon: '😊' },
      'content': { label: 'Content', color: '#7DC383', icon: '😌' },
      'calm': { label: 'Calm', color: '#98A1BC', icon: '🧘' },
      'focused': { label: 'Focused', color: '#6B8EE5', icon: '🎯' },
      'anxious': { label: 'Anxious', color: theme.colors.warning, icon: '😟' },
      'stressed': { label: 'Stressed', color: '#FF8A80', icon: '😣' },
      'sad': { label: 'Sad', color: '#9E9E9E', icon: '😢' },
      'frustrated': { label: 'Frustrated', color: theme.colors.error, icon: '😤' },
      'tired': { label: 'Tired', color: '#B8BFD0', icon: '😴' },
      // Fallback for old format
      'positive': { label: 'Positive', color: theme.colors.success, icon: '😊' },
      'negative': { label: 'Negative', color: theme.colors.error, icon: '😢' },
      'neutral': { label: 'Neutral', color: theme.colors.secondary, icon: '😐' },
      'mixed': { label: 'Mixed', color: theme.colors.warning, icon: '🤔' },
    };
    return emotionMap[emotionalColor?.toLowerCase()] || emotionMap.neutral;
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderSection = (
    title: string,
    content: string | string[],
    color: string,
    sectionKey: string
  ) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    const isExpanded = expandedSections.has(sectionKey);
    const isArray = Array.isArray(content);
    const hasMoreContent = isArray ? content.length > 2 : content.length > 150;
    
    return (
      <AnimatedCard
        variant="elevated"
        animationType="slide"
        delay={200}
        style={styles.sectionCard}
      >
        <Pressable
          onPress={() => hasMoreContent && toggleSection(sectionKey)}
          style={styles.sectionHeader}
        >
          <View style={[styles.sectionIcon, { backgroundColor: `${color}20` }]}>
            <View style={styles.sectionIconDot} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {hasMoreContent && (
            <Svg width="20" height="20" viewBox="0 0 24 24" style={[
              styles.expandIcon,
              isExpanded && styles.expandIconRotated
            ]}>
              <Path
                d="M7 10l5 5 5-5"
                stroke={theme.colors.text.secondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          )}
        </Pressable>
        
        <View style={styles.sectionContent}>
          {isArray ? (
            content.slice(0, isExpanded ? undefined : 2).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listDot}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text 
              style={styles.contentText}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {content}
            </Text>
          )}
        </View>
      </AnimatedCard>
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

  // Get emotional color from new format or fallback to old sentiment
  const emotionalColor = review.content?.emotional_color || review.sentiment || 'neutral';
  const emotionInfo = getEmotionalColorInfo(emotionalColor);
  const reviewScore = review.content?.score || review.score || review.mood_score;

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
          {/* Date & Sentiment Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }}
          >
            <AnimatedCard variant="elevated" style={styles.mainCard}>
              <LinearGradient
                colors={[`${emotionInfo.color}10`, theme.colors.surface]}
                style={styles.mainCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Text style={styles.date}>{formatDate(review.review_date || review.date)}</Text>
                
                <View style={styles.sentimentContainer}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: emotionInfo.color }]}>
                    <Text style={styles.emotionIcon}>{emotionInfo.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sentimentLabel}>Emotional State</Text>
                    <Text style={[styles.sentimentValue, { color: emotionInfo.color }]}>
                      {emotionInfo.label}
                    </Text>
                  </View>
                </View>
                
                {reviewScore !== undefined && reviewScore !== null && (
                  <View style={styles.moodContainer}>
                    <View style={styles.moodBar}>
                      <Animated.View
                        style={[
                          styles.moodFill,
                          {
                            width: `${reviewScore}%`,
                            backgroundColor: emotionInfo.color,
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.moodText}>
                      Day Score: {reviewScore}/100
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </AnimatedCard>
          </Animated.View>

          {/* Day Overview / Summary */}
          {(review.content?.day_overview || review.summary) && renderSection(
            'Day Overview',
            review.content?.day_overview || review.summary,
            theme.colors.primary,
            'overview'
          )}

          {/* Achievements */}
          {(review.content?.achievements || review.achievements) && renderSection(
            'Achievements',
            review.content?.achievements || review.achievements,
            theme.colors.success,
            'achievements'
          )}

          {/* Areas for Improvement */}
          {review.content?.areas_for_improvement && renderSection(
            'Areas for Improvement',
            review.content.areas_for_improvement,
            theme.colors.warning,
            'improvement'
          )}

          {/* Goal Progress */}
          {review.content?.goal_progress && (
            <AnimatedCard variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Goal Progress</Text>
              <View style={styles.sectionContent}>
                {Object.entries(review.content.goal_progress).map(([goal, progress]) => (
                  <View key={goal} style={styles.goalItem}>
                    <Text style={styles.goalName}>{goal}:</Text>
                    <Text style={styles.goalProgress}>{progress as string}</Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Tomorrow Recommendations */}
          {(review.content?.tomorrow_recommendations || review.tomorrow_focus) && renderSection(
            'Tomorrow\'s Focus',
            review.content?.tomorrow_recommendations || review.tomorrow_focus,
            theme.colors.primary,
            'tomorrow'
          )}

          {/* Old format fields */}
          {review.key_topics && renderSection(
            'Key Topics',
            review.key_topics,
            theme.colors.info,
            'topics'
          )}

          {review.challenges && renderSection(
            'Challenges',
            review.challenges,
            theme.colors.error,
            'challenges'
          )}

          {review.gratitude && renderSection(
            'Gratitude',
            review.gratitude,
            theme.colors.info,
            'gratitude'
          )}

          {/* XP Earned */}
          {(review.content?.xp_earned || (review.skills_developed && review.skills_developed.length > 0)) && (
            <AnimatedCard variant="elevated" style={styles.skillsCard}>
              <Text style={styles.skillsTitle}>XP Earned</Text>
              <View style={styles.skillsGrid}>
                {review.content?.xp_earned ? (
                  Object.entries(review.content.xp_earned).map(([skill, xp]) => (
                    <View key={skill} style={styles.skillBadge}>
                      <Text style={styles.skillName}>{skill}</Text>
                      <Text style={styles.skillXP}>+{xp} XP</Text>
                    </View>
                  ))
                ) : (
                  review.skills_developed.map((skill: any, index: number) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillName}>{skill.skill}</Text>
                      <Text style={styles.skillXP}>+{skill.xp_gained} XP</Text>
                    </View>
                  ))
                )}
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
  mainCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  mainCardGradient: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  date: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sentimentIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.md,
    opacity: 0.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionIcon: {
    fontSize: 24,
  },
  sentimentLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  sentimentValue: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  moodContainer: {
    marginTop: theme.spacing.sm,
  },
  moodBar: {
    height: 6,
    backgroundColor: theme.colors.overlay,
    borderRadius: 3,
    overflow: 'hidden',
  },
  moodFill: {
    height: '100%',
    borderRadius: 3,
  },
  moodText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sectionContent: {
    marginLeft: 44,
  },
  contentText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  listDot: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  listText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  skillsCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  skillsTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  skillName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  skillXP: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.success,
  },
  goalItem: {
    marginBottom: theme.spacing.md,
  },
  goalName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  goalProgress: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default ReviewDetailScreen;