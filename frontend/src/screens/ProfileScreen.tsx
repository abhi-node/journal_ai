import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
  Pressable,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { formatUTCToLocal } from '../utils/timezone';
import { API_CONFIG } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { theme, elevation } from '../theme';
import { AnimatedCard, AnimatedButton } from '../components/ui';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Form state
  const [editedName, setEditedName] = useState('');
  const [editedCurrentGoals, setEditedCurrentGoals] = useState('');
  const [editedYearlyGoals, setEditedYearlyGoals] = useState('');
  const [editedTenYearVision, setEditedTenYearVision] = useState('');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setEditedName(user.name || '');
      setEditedCurrentGoals(user.goals?.current_goals || '');
      setEditedYearlyGoals(user.goals?.yearly_goals || '');
      setEditedTenYearVision(user.goals?.ten_year_vision || '');
    }
  }, [user]);

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
      
      fetchUserData(false);
    }, [])
  );

  // Fetch fresh user data
  const fetchUserData = useCallback(async (showLoader = true) => {
    if (!token) return;
    
    if (showLoader) setDataLoading(true);
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
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [token, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(false);
  }, [fetchUserData]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        { 
          text: 'Logout',
          onPress: () => dispatch(logout()),
          style: 'destructive'
        }
      ]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          goals: {
            current_goals: editedCurrentGoals,
            yearly_goals: editedYearlyGoals,
            ten_year_vision: editedTenYearVision,
          }
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(updateUser(updatedUser));
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatMemberSince = (date: string) => {
    if (!date) return 'Recently joined';
    const memberDate = new Date(date);
    return `Member since ${memberDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
  };

  if (dataLoading) {
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.soft}
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
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.headerTop}>
              <Text style={styles.title}>Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editButton}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path
                    d={isEditing ? 
                      "M5 13l4 4L19 7" : 
                      "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    }
                    stroke={theme.colors.text.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* User Info Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }}
          >
            <AnimatedCard variant="elevated" style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.text.light}
                />
              ) : (
                <Text style={styles.userName}>
                  {user?.name || 'Anonymous User'}
                </Text>
              )}
              
              <Text style={styles.userEmail}>{user?.email}</Text>
              
              <Text style={styles.memberSince}>
                {formatMemberSince(user?.created_at || '')}
              </Text>
            </AnimatedCard>
          </Animated.View>

          {/* Goals Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }}
          >
            <Text style={styles.sectionTitle}>Goals</Text>
            
            <AnimatedCard variant="elevated" style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIcon}>
                  <Text>🎯</Text>
                </View>
                <Text style={styles.goalTitle}>Current Goals (3-6 months)</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.goalInput]}
                  value={editedCurrentGoals}
                  onChangeText={setEditedCurrentGoals}
                  placeholder="What are you working on?"
                  placeholderTextColor={theme.colors.text.light}
                  multiline
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.goalText}>
                  {user?.goals?.current_goals || 'No goals set yet'}
                </Text>
              )}
            </AnimatedCard>

            <AnimatedCard variant="elevated" style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIcon}>
                  <Text>📅</Text>
                </View>
                <Text style={styles.goalTitle}>Yearly Goals</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.goalInput]}
                  value={editedYearlyGoals}
                  onChangeText={setEditedYearlyGoals}
                  placeholder="What do you want to achieve this year?"
                  placeholderTextColor={theme.colors.text.light}
                  multiline
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.goalText}>
                  {user?.goals?.yearly_goals || 'No goals set yet'}
                </Text>
              )}
            </AnimatedCard>

            <AnimatedCard variant="elevated" style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIcon}>
                  <Text>🚀</Text>
                </View>
                <Text style={styles.goalTitle}>10-Year Vision</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.goalInput]}
                  value={editedTenYearVision}
                  onChangeText={setEditedTenYearVision}
                  placeholder="Where do you see yourself?"
                  placeholderTextColor={theme.colors.text.light}
                  multiline
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.goalText}>
                  {user?.goals?.ten_year_vision || 'No vision set yet'}
                </Text>
              )}
            </AnimatedCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: fadeAnim }
            ]}
          >
            {isEditing ? (
              <View style={styles.editButtons}>
                <AnimatedButton
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setIsEditing(false);
                    // Reset values
                    setEditedName(user?.name || '');
                    setEditedCurrentGoals(user?.goals?.current_goals || '');
                    setEditedYearlyGoals(user?.goals?.yearly_goals || '');
                    setEditedTenYearVision(user?.goals?.ten_year_vision || '');
                  }}
                  style={styles.button}
                />
                <AnimatedButton
                  title="Save Changes"
                  variant="primary"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.button}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <LinearGradient
                  colors={[theme.colors.error, '#D68080']}
                  style={styles.logoutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.logoutText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation(2),
  },
  userCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.inverse,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  nameInput: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    minWidth: 200,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  memberSince: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  goalCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  goalTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  goalText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  goalInput: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  editButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
  logoutButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...elevation(4),
  },
  logoutGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.inverse,
  },
});

export default ProfileScreen;