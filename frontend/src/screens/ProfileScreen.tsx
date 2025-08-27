import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [editedName, setEditedName] = useState('');
  const [editedCurrentGoals, setEditedCurrentGoals] = useState('');
  const [editedYearlyGoals, setEditedYearlyGoals] = useState('');
  const [editedTenYearVision, setEditedTenYearVision] = useState('');
  const [editedPriorityAreas, setEditedPriorityAreas] = useState<string[]>([]);

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setEditedName(user.name || '');
      setEditedCurrentGoals(user.goals?.current_goals || '');
      setEditedYearlyGoals(user.goals?.yearly_goals || '');
      setEditedTenYearVision(user.goals?.ten_year_vision || '');
      setEditedPriorityAreas(Array.isArray(user.goals?.priority_areas) ? user.goals.priority_areas : []);
    }
  }, [user]);

  // Debug token availability
  useEffect(() => {
    console.log('ProfileScreen - Token from Redux:', token);
    console.log('ProfileScreen - Token exists:', !!token);
    console.log('ProfileScreen - User:', user);
  }, [token, user]);

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
    console.log('Token in ProfileScreen:', token);
    console.log('Token type:', typeof token);
    console.log('Token exists:', !!token);
    
    if (!token) {
      Alert.alert('Error', 'Authentication token not found. Please login again.');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        name: editedName,
        goals: {
          current_goals: editedCurrentGoals,
          yearly_goals: editedYearlyGoals,
          ten_year_vision: editedTenYearVision,
          priority_areas: editedPriorityAreas,
        },
      };

      console.log('Sending request with Authorization:', `Bearer ${token}`);
      
      const response = await fetch(`${API_CONFIG.API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(updateUser(updatedUser));
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(user?.name || '');
    setEditedCurrentGoals(user?.goals?.current_goals || '');
    setEditedYearlyGoals(user?.goals?.yearly_goals || '');
    setEditedTenYearVision(user?.goals?.ten_year_vision || '');
    setEditedPriorityAreas(Array.isArray(user?.goals?.priority_areas) ? user.goals.priority_areas : []);
    setIsEditing(false);
  };

  const togglePriorityArea = (area: string) => {
    setEditedPriorityAreas(prev => 
      prev.includes(area) 
        ? prev.filter(item => item !== area)
        : [...prev, area]
    );
  };

  const priorityOptions = [
    { id: 'health', label: 'Health & Wellness', color: '#36D592' },
    { id: 'career', label: 'Career & Growth', color: '#FFD700' },
    { id: 'relationships', label: 'Relationships', color: '#FF7849' },
    { id: 'personal', label: 'Personal Development', color: '#B483F0' },
    { id: 'financial', label: 'Financial Freedom', color: '#4ECDC4' },
    { id: 'creativity', label: 'Creativity & Hobbies', color: '#FF6B6B' },
  ];

  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6">
            {/* Header */}
            <View className="pt-4 pb-2">
              <View className="flex-row justify-between items-center px-2">
                <View>
                  <Text 
                    className="text-3xl text-neutral-dark"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    Profile
                  </Text>
                  <Text 
                    className="text-sm text-neutral-mid mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Manage your personal information
                  </Text>
                </View>
                {!isEditing ? (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#36D592', '#13BC71']}
                      style={styles.editButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Svg width="18" height="18" viewBox="0 0 24 24">
                        <Path
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                          fill="white"
                        />
                      </Svg>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={handleCancel}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <View style={styles.cancelButton}>
                        <Text 
                          className="text-neutral-deep text-sm"
                          style={{ fontFamily: 'Poppins-SemiBold' }}
                        >
                          Cancel
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['#36D592', '#13BC71']}
                        style={styles.saveButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text 
                            className="text-white text-sm"
                            style={{ fontFamily: 'Poppins-Bold' }}
                          >
                            Save
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Level Card */}
            {user?.stats && (
              <View className="mt-6 mb-6">
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
                        Current Level
                      </Text>
                      <Text 
                        className="text-5xl text-white"
                        style={{ fontFamily: 'Poppins-Bold' }}
                      >
                        {user.stats.level || 1}
                      </Text>
                      <Text 
                        className="text-white/70 text-xs mt-1"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {user.stats.total_xp || 0} XP earned
                      </Text>
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
                </LinearGradient>
              </View>
            )}

            {/* Basic Information Section */}
            <View className="mb-6">
              <Text 
                className="text-neutral-dark text-lg mb-4"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Basic Information
              </Text>
              
              <BlurView intensity={30} tint="light" style={styles.infoCard}>
                <View className="p-5">
                  {/* Name Field */}
                  <View className="mb-5">
                    <Text 
                      className="text-neutral-mid text-xs mb-2 uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Name
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedName}
                        onChangeText={setEditedName}
                        style={[styles.input, { fontFamily: 'Poppins-Medium' }]}
                        placeholder="Enter your name"
                        placeholderTextColor="#C5BFD3"
                      />
                    ) : (
                      <Text 
                        className="text-neutral-dark text-base"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {user?.name || 'Not set'}
                      </Text>
                    )}
                  </View>

                  {/* Email Field */}
                  <View>
                    <Text 
                      className="text-neutral-mid text-xs mb-2 uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Email
                    </Text>
                    <Text 
                      className="text-neutral-dark text-base"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {user?.email || 'Not set'}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Goals Section */}
            <View className="mb-6">
              <Text 
                className="text-neutral-dark text-lg mb-4"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Your Goals & Vision
              </Text>
              
              {/* Current Goals */}
              <BlurView intensity={30} tint="light" style={[styles.infoCard, { marginBottom: 16 }]}>
                <View className="p-5">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-full bg-pastel-mint-100 items-center justify-center mr-3">
                      <Svg width="16" height="16" viewBox="0 0 24 24">
                        <Circle cx="12" cy="12" r="10" stroke="#36D592" strokeWidth="2" fill="none"/>
                        <Circle cx="12" cy="12" r="3" fill="#36D592"/>
                      </Svg>
                    </View>
                    <Text 
                      className="text-neutral-mid text-xs uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Current Goals (3-6 months)
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={editedCurrentGoals}
                      onChangeText={setEditedCurrentGoals}
                      style={[styles.input, styles.multilineInput, { fontFamily: 'Poppins-Medium' }]}
                      placeholder="What are you working on now?"
                      placeholderTextColor="#C5BFD3"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text 
                      className="text-neutral-dark text-base leading-6"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {user?.goals?.current_goals || 'No current goals set'}
                    </Text>
                  )}
                </View>
              </BlurView>

              {/* Yearly Goals */}
              <BlurView intensity={30} tint="light" style={[styles.infoCard, { marginBottom: 16 }]}>
                <View className="p-5">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-full bg-pastel-lavender-100 items-center justify-center mr-3">
                      <Svg width="16" height="16" viewBox="0 0 24 24">
                        <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="#B483F0"/>
                      </Svg>
                    </View>
                    <Text 
                      className="text-neutral-mid text-xs uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Yearly Goals
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={editedYearlyGoals}
                      onChangeText={setEditedYearlyGoals}
                      style={[styles.input, styles.multilineInput, { fontFamily: 'Poppins-Medium' }]}
                      placeholder="What do you want to achieve this year?"
                      placeholderTextColor="#C5BFD3"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text 
                      className="text-neutral-dark text-base leading-6"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {user?.goals?.yearly_goals || 'No yearly goals set'}
                    </Text>
                  )}
                </View>
              </BlurView>

              {/* Ten Year Vision */}
              <BlurView intensity={30} tint="light" style={[styles.infoCard, { marginBottom: 16 }]}>
                <View className="p-5">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-full bg-pastel-peach-100 items-center justify-center mr-3">
                      <Svg width="16" height="16" viewBox="0 0 24 24">
                        <Path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="#FF7849"/>
                      </Svg>
                    </View>
                    <Text 
                      className="text-neutral-mid text-xs uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      10-Year Vision
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={editedTenYearVision}
                      onChangeText={setEditedTenYearVision}
                      style={[styles.input, styles.multilineInput, { fontFamily: 'Poppins-Medium' }]}
                      placeholder="Where do you see yourself in 10 years?"
                      placeholderTextColor="#C5BFD3"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text 
                      className="text-neutral-dark text-base leading-6"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {user?.goals?.ten_year_vision || 'No long-term vision set'}
                    </Text>
                  )}
                </View>
              </BlurView>

              {/* Priority Areas */}
              <BlurView intensity={30} tint="light" style={styles.infoCard}>
                <View className="p-5">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full bg-pastel-rose-100 items-center justify-center mr-3">
                      <Svg width="16" height="16" viewBox="0 0 24 24">
                        <Path d="M7 14l5-5 5 5z" fill="#FF6B6B"/>
                        <Path d="M12 2L3 21h18L12 2z" stroke="#FF6B6B" strokeWidth="2" fill="none"/>
                      </Svg>
                    </View>
                    <Text 
                      className="text-neutral-mid text-xs uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Priority Areas
                    </Text>
                  </View>
                  {isEditing ? (
                    <View className="flex-row flex-wrap gap-2">
                      {priorityOptions.map((option) => {
                        const isSelected = editedPriorityAreas.includes(option.id);
                        return (
                          <TouchableOpacity
                            key={option.id}
                            onPress={() => togglePriorityArea(option.id)}
                            activeOpacity={0.7}
                            style={[
                              styles.priorityChip,
                              isSelected && { backgroundColor: option.color + '20', borderColor: option.color }
                            ]}
                          >
                            <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: option.color }} />
                            <Text 
                              style={{ 
                                fontFamily: isSelected ? 'Poppins-SemiBold' : 'Poppins-Regular',
                                color: isSelected ? option.color : '#7A7890',
                                fontSize: 13,
                              }}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap gap-2">
                      {Array.isArray(user?.goals?.priority_areas) && user.goals.priority_areas.length > 0 ? (
                        user.goals.priority_areas.map((area, index) => {
                          const option = priorityOptions.find(opt => opt.id === area);
                          return (
                            <View
                              key={index}
                              style={[
                                styles.priorityChip,
                                { backgroundColor: option?.color + '20' || '#36D59220', borderColor: option?.color || '#36D592' }
                              ]}
                            >
                              <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: option?.color || '#36D592' }} />
                              <Text 
                                style={{ 
                                  fontFamily: 'Poppins-Medium',
                                  color: option?.color || '#36D592',
                                  fontSize: 13,
                                }}
                              >
                                {option?.label || area.charAt(0).toUpperCase() + area.slice(1).replace('_', ' ')}
                              </Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text 
                          className="text-neutral-mid text-base"
                          style={{ fontFamily: 'Poppins-Regular' }}
                        >
                          No priority areas set
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </BlurView>
            </View>

            {/* Account Section */}
            <View className="mb-6">
              <Text 
                className="text-neutral-dark text-lg mb-4"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Account Settings
              </Text>
              
              {/* Member Since */}
              <BlurView intensity={30} tint="light" style={[styles.infoCard, { marginBottom: 12 }]}>
                <View className="p-4 flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-pastel-lavender-100 items-center justify-center mr-3">
                      <Svg width="20" height="20" viewBox="0 0 24 24">
                        <Path
                          d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                          fill="#B483F0"
                        />
                      </Svg>
                    </View>
                    <View>
                      <Text 
                        className="text-neutral-dark text-sm"
                        style={{ fontFamily: 'Poppins-SemiBold' }}
                      >
                        Member Since
                      </Text>
                      <Text 
                        className="text-neutral-mid text-xs"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        }) : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </BlurView>

              {/* Logout Button */}
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFE3EC', '#FFCBDB']}
                  style={styles.logoutButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View className="flex-row items-center justify-center">
                    <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                      <Path
                        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                        fill="#FF5A70"
                      />
                    </Svg>
                    <Text 
                      className="text-pastel-rose-700 text-base"
                      style={{ fontFamily: 'Poppins-Bold' }}
                    >
                      Logout
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E3EB',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  levelCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: '#13BC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  infoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(229,227,235,0.3)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F1B2E',
    borderWidth: 1,
    borderColor: '#E5E3EB',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: '#E5E3EB',
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
});

export default ProfileScreen;