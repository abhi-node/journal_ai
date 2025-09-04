import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  RefreshControl, 
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../config/api';
import { theme, elevation } from '../theme';
import { AnimatedCard } from '../components/ui';
import RankRoadmapModal from '../components/RankRoadmapModal';
import { RANKS, getRankInfo, getRankIcon } from '../utils/ranks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - theme.spacing.md * 2;

const SkillsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showRankModal, setShowRankModal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const skills = user?.stats?.skill_categories || {};
  const userLevel = user?.stats?.level || 1;
  const totalXP = user?.stats?.total_xp || 0;

  // Linear gap XP system: XP needed for next level = currentLevel * 100
  const xpForCurrentLevel = 50 * userLevel * (userLevel - 1);
  const xpForNextLevel = userLevel * 100; // Gap increases by 100 each level
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpProgressPercentage = xpForNextLevel > 0 ? (xpProgress / xpForNextLevel) * 100 : 100;

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

  // Entrance animations and data fetch on tab focus
  useFocusEffect(
    useCallback(() => {
      // Reset and start animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
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
      
      // Fetch fresh data
      fetchUserData(false);
    }, [fetchUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(false);
  }, [fetchUserData]);

  const getSkillColor = (skillData: any) => {
    // Use color from backend if available, otherwise use a default based on skill name
    if (skillData.color) {
      return skillData.color;
    }
    
    // Fallback colors for skills without backend colors
    const colors = ['#7DC383', '#F5C99B', '#98A1BC', '#E8A0A0', '#B8BFD0'];
    const index = Math.abs(skillData.name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getSkillIcon = (skillData: any) => {
    // Use icon from backend if available
    if (skillData.icon) {
      return skillData.icon;
    }
    
    // Fallback to default icon
    return '⭐';
  };

  const renderSkillCard = (skillName: string, skillData: any, index: number) => {
    const { xp = 0, level = 1 } = skillData;
    // Linear gap XP system for skills: same formula as overall level
    const skillXpForCurrent = 50 * level * (level - 1);
    const skillXpForNext = level * 100; // Gap increases by 100 each level
    const skillXpProgress = xp - skillXpForCurrent;
    const skillProgress = skillXpForNext > 0 ? skillXpProgress / skillXpForNext : 1;
    const color = getSkillColor(skillData);
    const icon = getSkillIcon(skillData);
    const isSelected = selectedSkill === skillName;
    
    // Get user's rank color for borders
    const userRank = getRankInfo(userLevel);
    const rankColor = userRank?.color || '#B8B5B2';

    return (
      <AnimatedCard
        key={skillName}
        variant="elevated"
        animationType="scale"
        delay={index * 100}
        style={{
          ...styles.skillCard,
          borderColor: rankColor,
          borderLeftColor: rankColor,
          width: CARD_WIDTH,
          ...(isSelected ? styles.selectedCard : {}),
        } as any}
        onPress={() => setSelectedSkill(isSelected ? null : skillName)}
      >
        <View style={styles.cardContentRow}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          
          {/* Skill Info */}
          <View style={styles.skillInfo}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName} numberOfLines={2}>
                {skillName}
              </Text>
              <View style={[styles.levelBadge, { backgroundColor: `${rankColor}20`, borderColor: rankColor }]}>
                <Text style={[styles.levelText, { color: rankColor }]}>Lv {level}</Text>
              </View>
            </View>
            
            {/* XP Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${skillProgress * 100}%`,
                      backgroundColor: color,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.xpText, { color: theme.colors.text.secondary }]}>{skillXpProgress}/{skillXpForNext} XP</Text>
            </View>
          </View>
        </View>
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.title}>Skills</Text>
            
            {/* Overall Level Card */}
            <TouchableOpacity onPress={() => setShowRankModal(true)} activeOpacity={0.8}>
              <LinearGradient
                colors={getRankInfo(userLevel)?.special_effect === 'rainbow' 
                  ? ['#FFD0F0', '#FFE0D0', '#FFFFD0', '#D0FFD0', '#D0F0FF', '#E0D0FF', '#FFD0FF']
                  : [getRankInfo(userLevel)?.gradient_start || '#B8B5B2', getRankInfo(userLevel)?.gradient_end || '#D0CDCA']
                }
                style={styles.levelCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                  <View style={styles.levelContent}>
                    <View style={styles.levelInfo}>
                      <Text style={styles.levelTitle}>Level</Text>
                      <Text style={styles.levelNumber}>{userLevel}</Text>
                      {getRankInfo(userLevel) && (
                        <View style={styles.userRankContainer}>
                          <Text style={styles.userRankIcon}>
                            {getRankIcon(getRankInfo(userLevel)!.icon_placeholder)}
                          </Text>
                          <Text style={styles.userRankName}>
                            {getRankInfo(userLevel)!.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.xpInfo}>
                      <Text style={styles.xpLabel}>Total XP</Text>
                      <Text style={styles.xpValue}>{totalXP.toLocaleString()}</Text>
                      <Text style={styles.tapHint}>Tap to view ranks</Text>
                    </View>
                  </View>
                
                {/* XP Progress */}
                <View style={styles.mainProgressContainer}>
                  <View style={styles.mainProgressBackground}>
                    <Animated.View 
                      style={[
                        styles.mainProgressFill,
                        { width: `${xpProgressPercentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {Math.max(0, xpProgress)}/{xpForNextLevel} to level {Math.min(userLevel + 1, 999)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Skills List */}
          <View style={styles.skillsList}>
            {Object.entries(skills).map(([skillName, skillData], index) => 
              renderSkillCard(skillName, skillData, index)
            )}
          </View>

          {/* Empty State */}
          {Object.keys(skills).length === 0 && (
            <AnimatedCard variant="flat" style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>
                Start journaling to build your skills
              </Text>
            </AnimatedCard>
          )}
        </ScrollView>
      </LinearGradient>
      
      {/* Rank Roadmap Modal */}
      <RankRoadmapModal
        visible={showRankModal}
        onClose={() => setShowRankModal(false)}
        currentLevel={userLevel}
        currentXP={totalXP}
        ranks={RANKS}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
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
  levelCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    ...elevation(3),
  },
  levelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  levelNumber: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.inverse,
  },
  xpInfo: {
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  xpValue: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.inverse,
  },
  mainProgressContainer: {
    marginTop: theme.spacing.sm,
  },
  mainProgressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mainProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  skillsList: {
    paddingHorizontal: theme.spacing.md,
  },
  skillCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderLeftWidth: 5,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  cardContentRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardGradient: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minHeight: 160,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  skillName: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  levelText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  progressContainer: {
    flex: 1,
  },
  progressBackground: {
    height: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  xpText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.xs,
  },
  emptyState: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  userRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  userRankIcon: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  userRankName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.inverse,
    opacity: 0.95,
  },
  tapHint: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default SkillsScreen;