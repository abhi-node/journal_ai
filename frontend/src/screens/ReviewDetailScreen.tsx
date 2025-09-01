import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { reviewsAPI } from '../services/api';
import { formatUTCToLocalDate } from '../utils/timezone';

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

  useEffect(() => {
    if (route.params?.reviewId && !route.params?.reviewData) {
      fetchReview();
    }
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
    // If it's a full timestamp, use it directly
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // For date-only strings (YYYY-MM-DD), parse components to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in JS)
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#36D592';
    if (score >= 60) return '#FFD700';
    if (score >= 40) return '#FF7849';
    return '#FF4444';
  };

  const getEmotionConfig = (emotion: string) => {
    const emotions: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
      energized: { color: '#FF7849', bgColor: '#FF784920', label: 'Energized', icon: '⚡' },
      happy: { color: '#FFD700', bgColor: '#FFD70020', label: 'Happy', icon: '😊' },
      content: { color: '#36D592', bgColor: '#36D59220', label: 'Content', icon: '😌' },
      calm: { color: '#87CEEB', bgColor: '#87CEEB20', label: 'Calm', icon: '🧘' },
      focused: { color: '#4169E1', bgColor: '#4169E120', label: 'Focused', icon: '🎯' },
      anxious: { color: '#FF6B6B', bgColor: '#FF6B6B20', label: 'Anxious', icon: '😟' },
      stressed: { color: '#FF4444', bgColor: '#FF444420', label: 'Stressed', icon: '😣' },
      sad: { color: '#6B5B95', bgColor: '#6B5B9520', label: 'Sad', icon: '😢' },
      frustrated: { color: '#DC143C', bgColor: '#DC143C20', label: 'Frustrated', icon: '😤' },
      tired: { color: '#9E9E9E', bgColor: '#9E9E9E20', label: 'Tired', icon: '😴' },
    };
    return emotions[emotion] || emotions.content;
  };

  const renderDailyReview = () => {
    const content = review.content;
    return (
      <>
        {/* Day Overview */}
        <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-3">
              <Svg width="18" height="18" viewBox="0 0 24 24">
                <Path
                  d="M8 7V3M16 7V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
            <Text 
              className="text-lg text-neutral-dark"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              What Happened Today
            </Text>
          </View>
          <Text 
            className="text-base text-neutral-deep leading-6"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {content.day_overview || content.summary}
          </Text>
        </View>

        {/* Achievements */}
        {content.achievements?.length > 0 && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#36D592"
                  />
                </Svg>
              </View>
              <Text 
                className="text-lg text-neutral-dark"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Achievements
              </Text>
            </View>
            {content.achievements.map((achievement: string, index: number) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-green-500 mr-2">•</Text>
                <Text 
                  className="text-base text-neutral-deep flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {achievement}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Areas for Improvement */}
        {content.areas_for_improvement?.length > 0 && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-orange-100 rounded-lg items-center justify-center mr-3">
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    stroke="#FF7849"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
              <Text 
                className="text-lg text-neutral-dark"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Areas for Improvement
              </Text>
            </View>
            {content.areas_for_improvement.map((area: string, index: number) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-orange-500 mr-2">•</Text>
                <Text 
                  className="text-base text-neutral-deep flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {area}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Goal Progress */}
        {content.goal_progress && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <Text 
              className="text-lg text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Goal Progress
            </Text>
            {Object.entries(content.goal_progress).map(([category, progress]) => (
              <View key={category} className="mb-3">
                <Text 
                  className="text-base text-neutral-dark capitalize mb-1"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {category}
                </Text>
                <Text 
                  className="text-sm text-neutral-deep"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {progress as string}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tomorrow's Recommendations */}
        {content.tomorrow_recommendations?.length > 0 && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path
                    d="M12 2v10l4 2M12 2L8 4M12 2l4 2"
                    stroke="#B483F0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="12" cy="12" r="10" stroke="#B483F0" strokeWidth="2" fill="none" />
                </Svg>
              </View>
              <Text 
                className="text-lg text-neutral-dark"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Tomorrow's Recommendations
              </Text>
            </View>
            {content.tomorrow_recommendations.map((rec: string, index: number) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-purple-500 mr-2">→</Text>
                <Text 
                  className="text-base text-neutral-deep flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderWeeklyReview = () => {
    const content = review.content;
    return (
      <>
        {/* Week Summary */}
        <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
          <Text 
            className="text-lg text-neutral-dark mb-3"
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Week Summary
          </Text>
          <Text 
            className="text-base text-neutral-deep leading-6"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {content.week_summary}
          </Text>
        </View>

        {/* Daily Scores */}
        {content.daily_scores?.length > 0 && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <Text 
              className="text-lg text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Daily Scores
            </Text>
            <View className="flex-row justify-between">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <View key={day} className="items-center">
                  <Text 
                    className="text-xs text-neutral-mid mb-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {day}
                  </Text>
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: getScoreColor(content.daily_scores[index] || 0) + '20' }}
                  >
                    <Text 
                      className="text-sm"
                      style={{ 
                        fontFamily: 'Poppins-SemiBold',
                        color: getScoreColor(content.daily_scores[index] || 0)
                      }}
                    >
                      {content.daily_scores[index] || '-'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Achievements */}
        {content.top_achievements?.length > 0 && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#36D592"
                  />
                </Svg>
              </View>
              <Text 
                className="text-lg text-neutral-dark"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Top Achievements
              </Text>
            </View>
            {content.top_achievements.map((achievement: string, index: number) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-green-500 mr-2">★</Text>
                <Text 
                  className="text-base text-neutral-deep flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {achievement}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Patterns */}
        {content.patterns && (
          <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light">
            <Text 
              className="text-lg text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Patterns Identified
            </Text>
            {Object.entries(content.patterns).map(([type, patterns]) => (
              <View key={type} className="mb-3">
                <Text 
                  className="text-base text-neutral-dark capitalize mb-2"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {type}
                </Text>
                {(patterns as string[]).map((pattern, index) => (
                  <View key={index} className="flex-row items-start mb-1">
                    <Text className={type === 'positive' ? "text-green-500 mr-2" : "text-orange-500 mr-2"}>
                      {type === 'positive' ? '✓' : '!'}
                    </Text>
                    <Text 
                      className="text-sm text-neutral-deep flex-1"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {pattern}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-4 flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mr-4 p-2"
              activeOpacity={0.7}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#4B5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text 
              className="text-2xl text-neutral-dark flex-1"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {review?.type === 'weekly' ? 'Weekly' : 'Daily'} Review
            </Text>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#36D592" />
            </View>
          ) : review ? (
            <ScrollView 
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {/* Score and Date Card */}
              <View 
                className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-4 border border-neutral-light"
                style={review.type === 'daily' && review.content.emotional_color ? {
                  borderColor: getEmotionConfig(review.content.emotional_color).color + '40',
                  shadowColor: getEmotionConfig(review.content.emotional_color).color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8
                } : {}}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text 
                      className="text-sm text-neutral-mid mb-1"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {formatDate(review.date)}
                    </Text>
                    <Text 
                      className="text-2xl text-neutral-dark"
                      style={{ fontFamily: 'Poppins-Bold' }}
                    >
                      Score: {review.type === 'weekly' ? review.content.average_score : review.score}
                    </Text>
                    {review.type === 'daily' && review.content.emotional_color && (
                      <View className="flex-row items-center mt-2">
                        <Text className="text-lg mr-1">
                          {getEmotionConfig(review.content.emotional_color).icon}
                        </Text>
                        <Text 
                          className="text-sm"
                          style={{ 
                            fontFamily: 'Poppins-Medium',
                            color: getEmotionConfig(review.content.emotional_color).color
                          }}
                        >
                          Feeling {getEmotionConfig(review.content.emotional_color).label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View 
                    className="w-20 h-20 rounded-full items-center justify-center"
                    style={{ backgroundColor: getScoreColor(review.type === 'weekly' ? review.content.average_score : review.score) }}
                  >
                    <Text 
                      className="text-2xl text-white"
                      style={{ fontFamily: 'Poppins-Bold' }}
                    >
                      {review.type === 'weekly' ? Math.round(review.content.average_score) : review.score}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Review Content */}
              {review.type === 'daily' ? renderDailyReview() : renderWeeklyReview()}

              {/* Bottom padding for scroll */}
              <View className="h-8" />
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text 
                className="text-lg text-neutral-mid"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Review not found
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ReviewDetailScreen;