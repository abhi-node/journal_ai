import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 2 columns with padding

const SkillsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const skills = user?.stats?.skill_categories || {};
  const userLevel = user?.stats?.level || 1;
  const totalXP = user?.stats?.total_xp || 0;

  // Calculate XP needed for next level (simple formula: level * 100)
  const xpForNextLevel = userLevel * 100;
  const xpProgress = totalXP % xpForNextLevel;
  const xpProgressPercentage = (xpProgress / xpForNextLevel) * 100;

  const fetchUserData = useCallback(async (showLoader = true) => {
    if (!token) return;
    
    if (showLoader) setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch(updateUser(userData));
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dispatch]);

  // Fetch fresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserData(false);
    }, [fetchUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(false);
  }, [fetchUserData]);

  const renderSkillCard = (skillName: string, skillData: any) => {
    const { xp = 0, level = 1, color = '#36D592', icon = '🎯' } = skillData;
    const skillXpForNext = level * 50; // XP needed for next skill level
    const skillProgress = (xp % skillXpForNext) / skillXpForNext;

    return (
      <View key={skillName} style={[styles.skillCard, { width: CARD_WIDTH }]}>
        <LinearGradient
          colors={[color + '20', color + '10']}
          style={styles.skillGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Skill Icon and Name */}
          <View style={styles.skillHeader}>
            <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
              <Text style={styles.skillIcon}>{icon}</Text>
            </View>
            <View style={styles.skillInfo}>
              <Text 
                style={styles.skillName}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {skillName}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelText, { color }]}>Lvl {level}</Text>
              </View>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpSection}>
            <Text style={styles.xpText}>{xp} XP</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${skillProgress * 100}%`,
                    backgroundColor: color 
                  }
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
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
        {loading && !user ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#36D592" />
            <Text className="text-neutral-mid text-sm mt-2" style={{ fontFamily: 'Poppins-Regular' }}>
              Loading skills...
            </Text>
          </View>
        ) : (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#36D592']}
              tintColor="#36D592"
            />
          }
        >
          <View className="px-6">
            {/* Header */}
            <View className="pt-4 pb-2">
              <Text 
                className="text-3xl text-neutral-dark"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Skills & Progress
              </Text>
              <Text 
                className="text-sm text-neutral-mid mt-1"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Track your growth across different areas
              </Text>
            </View>

            {/* Overall Level Card */}
            <LinearGradient
              colors={['#36D592', '#13BC71']}
              style={styles.levelCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text 
                    className="text-white/80 text-sm mb-1"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Overall Level
                  </Text>
                  <Text 
                    className="text-5xl text-white"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {userLevel}
                  </Text>
                  <View className="mt-2">
                    <View className="flex-row justify-between mb-1">
                      <Text 
                        className="text-white/70 text-xs"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {totalXP} / {xpForNextLevel} XP
                      </Text>
                      <Text 
                        className="text-white/70 text-xs"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {Math.round(xpProgressPercentage)}%
                      </Text>
                    </View>
                    <View style={styles.levelProgressContainer}>
                      <View 
                        style={[
                          styles.levelProgressBar,
                          { width: `${xpProgressPercentage}%` }
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View className="items-center justify-center">
                  <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                    <Svg width="40" height="40" viewBox="0 0 24 24">
                      <Path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="white"
                        opacity="0.9"
                      />
                    </Svg>
                  </View>
                </View>
              </View>

              {/* Stats Summary */}
              <View className="flex-row justify-around mt-6 pt-4 border-t border-white/20">
                <View className="items-center">
                  <Text 
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {Object.keys(skills).length}
                  </Text>
                  <Text 
                    className="text-white/70 text-xs"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Skills
                  </Text>
                </View>
                <View className="items-center">
                  <Text 
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {user?.stats?.streak_days || 0}
                  </Text>
                  <Text 
                    className="text-white/70 text-xs"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Day Streak
                  </Text>
                </View>
                <View className="items-center">
                  <Text 
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {user?.stats?.total_entries || 0}
                  </Text>
                  <Text 
                    className="text-white/70 text-xs"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Entries
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Skills Grid */}
            <View className="mt-6">
              <Text 
                className="text-neutral-dark text-lg mb-4"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Your Skills
              </Text>
              
              {Object.keys(skills).length > 0 ? (
                <View style={styles.skillsGrid}>
                  {Object.entries(skills).map(([skillName, skillData]) => 
                    renderSkillCard(skillName, skillData)
                  )}
                </View>
              ) : (
                <BlurView intensity={30} tint="light" style={styles.emptyCard}>
                  <View className="p-8 items-center">
                    <View className="w-16 h-16 rounded-full bg-pastel-lavender-100 items-center justify-center mb-4">
                      <Svg width="32" height="32" viewBox="0 0 24 24">
                        <Path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="#B483F0"
                        />
                      </Svg>
                    </View>
                    <Text 
                      className="text-neutral-dark text-base text-center mb-2"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      No Skills Yet
                    </Text>
                    <Text 
                      className="text-neutral-mid text-sm text-center"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      Complete your goal setup to see your personalized skills
                    </Text>
                  </View>
                </BlurView>
              )}
            </View>
          </View>
        </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  levelCard: {
    padding: 24,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#13BC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  levelProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  skillCard: {
    marginBottom: 8,
  },
  skillGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  skillIcon: {
    fontSize: 20,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F1B2E',
    marginBottom: 2,
  },
  levelBadge: {
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  xpSection: {
    marginTop: 4,
  },
  xpText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#7A7890',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(229,227,235,0.3)',
  },
});

export default SkillsScreen;