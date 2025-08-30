import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { notesAPI, reviewsAPI } from '../services/api';

type TabType = 'notes' | 'reviews';

const JournalScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [notes, setNotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  useEffect(() => {
    loadData();
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
      // Get notes for the last 30 days
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
      setReviews(reviewsData || []);
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

  const handleGenerateReview = async () => {
    setIsGeneratingReview(true);
    try {
      const result = await reviewsAPI.generateDailyReview();
      
      Alert.alert(
        'Review Generation Started',
        'Your daily review is being generated and will appear shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setTimeout(() => {
                loadReviews();
              }, 5000);
            }
          }
        ]
      );
      
      setTimeout(() => {
        loadReviews();
      }, 10000);
      
    } catch (error: any) {
      console.error('Error generating review:', error);
      
      if (error.message?.includes('409')) {
        Alert.alert('Review Already Exists', 'A daily review already exists for today.');
      } else if (error.message?.includes('400')) {
        Alert.alert('No Notes Found', 'Please add some notes for today before generating a review.');
      } else {
        Alert.alert('Error', error.message || 'Failed to generate daily review. Please try again.');
      }
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#36D592';
    if (score >= 60) return '#FFD700';
    if (score >= 40) return '#FF7849';
    return '#FF4444';
  };

  const renderNoteItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('NoteDetail', { noteData: item })}
      activeOpacity={0.8}
      className="mb-3"
    >
      <View className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-neutral-light">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="#36D592"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M14 2v6h6"
                  stroke="#36D592"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View className="flex-1">
              <Text 
                className="text-base text-neutral-dark"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                {formatDate(item.date)}
              </Text>
              <Text 
                className="text-sm text-neutral-mid"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
          <Svg width="20" height="20" viewBox="0 0 24 24">
            <Path
              d="M9 18l6-6-6-6"
              stroke="#C5BFD3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text 
          className="text-sm text-neutral-deep"
          numberOfLines={2}
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }: { item: any }) => {
    const isWeekly = item.type === 'weekly';
    const score = isWeekly ? item.content.average_score : item.score;
    const color = getScoreColor(score);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ReviewDetail', { reviewData: item })}
        activeOpacity={0.8}
        className="mb-3"
      >
        <View 
          className="bg-white/60 backdrop-blur rounded-2xl p-4 border"
          style={{ borderColor: isWeekly ? '#B483F0' : '#36D592' }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: isWeekly ? '#B483F020' : '#36D59220' }}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  {isWeekly ? (
                    <Path
                      d="M8 7V3M16 7V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                      stroke="#B483F0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  ) : (
                    <Path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="#36D592"
                    />
                  )}
                </Svg>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text 
                    className="text-base text-neutral-dark mr-2"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    {isWeekly ? 'Weekly' : 'Daily'} Review
                  </Text>
                  <View 
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <Text 
                      className="text-xs"
                      style={{ fontFamily: 'Poppins-SemiBold', color }}
                    >
                      {Math.round(score)}
                    </Text>
                  </View>
                </View>
                <Text 
                  className="text-sm text-neutral-mid"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#C5BFD3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text 
            className="text-sm text-neutral-deep"
            numberOfLines={2}
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {item.content.day_overview || item.content.summary || item.content.week_summary}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = ({ type }: { type: TabType }) => (
    <View className="flex-1 justify-center items-center px-8 py-20">
      <View className="w-24 h-24 bg-neutral-light/30 rounded-full items-center justify-center mb-4">
        <Svg width="48" height="48" viewBox="0 0 24 24">
          {type === 'notes' ? (
            <Path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
              stroke="#C5BFD3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="#C5BFD3"
              strokeWidth="1.5"
              fill="none"
            />
          )}
        </Svg>
      </View>
      <Text 
        className="text-lg text-neutral-deep text-center mb-2"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        No {type === 'notes' ? 'Notes' : 'Reviews'} Yet
      </Text>
      <Text 
        className="text-sm text-neutral-mid text-center"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        {type === 'notes' 
          ? 'Start recording to create your first note'
          : 'Your reviews will appear here after recording notes'}
      </Text>
    </View>
  );

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
          <View className="px-6 pt-6 pb-4">
            <Text 
              className="text-3xl text-neutral-dark mb-4"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Journal
            </Text>
            
            {/* Tabs */}
            <View className="flex-row bg-white/40 backdrop-blur rounded-2xl p-1.5">
              <TouchableOpacity
                onPress={() => setActiveTab('notes')}
                activeOpacity={0.8}
                className="flex-1"
              >
                <View 
                  className={`py-3 px-4 rounded-xl ${activeTab === 'notes' ? 'bg-white' : ''}`}
                >
                  <Text 
                    className={`text-center ${activeTab === 'notes' ? 'text-neutral-dark' : 'text-neutral-mid'}`}
                    style={{ fontFamily: activeTab === 'notes' ? 'Poppins-SemiBold' : 'Poppins-Medium' }}
                  >
                    Notes
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('reviews')}
                activeOpacity={0.8}
                className="flex-1"
              >
                <View 
                  className={`py-3 px-4 rounded-xl ${activeTab === 'reviews' ? 'bg-white' : ''}`}
                >
                  <Text 
                    className={`text-center ${activeTab === 'reviews' ? 'text-neutral-dark' : 'text-neutral-mid'}`}
                    style={{ fontFamily: activeTab === 'reviews' ? 'Poppins-SemiBold' : 'Poppins-Medium' }}
                  >
                    Reviews
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 px-6">
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#36D592" />
              </View>
            ) : activeTab === 'notes' ? (
              notes.length > 0 ? (
                <FlatList
                  data={notes}
                  renderItem={renderNoteItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={['#36D592']}
                      tintColor="#36D592"
                    />
                  }
                  contentContainerStyle={{ paddingBottom: 100 }}
                />
              ) : (
                <EmptyState type="notes" />
              )
            ) : (
              <View className="flex-1">
                {/* Create Daily Review Button */}
                <TouchableOpacity
                  onPress={handleGenerateReview}
                  disabled={isGeneratingReview}
                  activeOpacity={0.8}
                  className="mb-4"
                >
                  <LinearGradient
                    colors={isGeneratingReview ? ['#E5E5E5', '#D0D0D0'] : ['#36D592', '#2BC482']}
                    style={{ borderRadius: 16, padding: 16 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View className="flex-row items-center justify-center">
                      {isGeneratingReview ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <Text 
                            className="text-white ml-2"
                            style={{ fontFamily: 'Poppins-SemiBold' }}
                          >
                            Generating Review...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                            <Path
                              d="M12 5v14M5 12h14"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                          <Text 
                            className="text-white"
                            style={{ fontFamily: 'Poppins-SemiBold' }}
                          >
                            Create Daily Review
                          </Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                {reviews.length > 0 ? (
                  <FlatList
                    data={reviews}
                    renderItem={renderReviewItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#36D592']}
                        tintColor="#36D592"
                      />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                  />
                ) : (
                  <EmptyState type="reviews" />
                )}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default JournalScreen;