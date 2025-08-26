import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState('home');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const statsSlideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(statsSlideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Pulse animation for record button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRecordPress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(recordButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(recordButtonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(recordButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const statsData = [
    {
      label: 'STREAK',
      value: user?.stats?.streak_days || 0,
      unit: 'days',
      color: ['#36D592', '#13BC71'],
      icon: '🔥',
    },
    {
      label: 'LEVEL',
      value: user?.stats?.level || 1,
      unit: `${user?.stats?.total_xp || 0} XP`,
      color: ['#B483F0', '#9F5FE5'],
      icon: '⭐',
    },
    {
      label: 'ENTRIES',
      value: user?.stats?.total_entries || 0,
      unit: 'total',
      color: ['#FF7849', '#FF5A2E'],
      icon: '📝',
    },
  ];

  const quickActions = [
    { 
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
            fill="#36D592"
          />
        </Svg>
      ),
      label: 'Analytics',
      color: '#36D592'
    },
    {
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="3" fill="#B483F0" />
          <Path
            d="M12 2L14.39 8.26L21 9.27L16 14.12L17.45 21L12 17.27L6.55 21L8 14.12L3 9.27L9.61 8.26L12 2Z"
            stroke="#B483F0"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      ),
      label: 'Goals',
      color: '#B483F0'
    },
    {
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="#FF7849" strokeWidth="2" />
          <Path d="M9 9h6M9 13h6M9 17h6" stroke="#FF7849" strokeWidth="2" />
        </Svg>
      ),
      label: 'History',
      color: '#FF7849'
    },
    {
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#FFD700"
          />
        </Svg>
      ),
      label: 'Insights',
      color: '#FFD700'
    },
  ];

  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Background decorative elements */}
        <View className="absolute inset-0">
          <Animated.View
            style={{
              position: 'absolute',
              top: 100,
              right: -60,
              transform: [{ translateY: floatAnim }],
              opacity: 0.1,
            }}
          >
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="80" fill="#36D592" opacity="0.2" />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 200,
              left: -40,
              transform: [{ translateY: Animated.multiply(floatAnim, -1) }],
              opacity: 0.1,
            }}
          >
            <Svg width="150" height="150" viewBox="0 0 150 150">
              <Circle cx="75" cy="75" r="60" fill="#B483F0" opacity="0.2" />
            </Svg>
          </Animated.View>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        >
          <Animated.View 
            className="flex-1 px-6"
            style={{ opacity: fadeAnim }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center pt-4 pb-6">
              <View className="flex-1">
                <Text 
                  className="text-4xl text-neutral-dark mb-1"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Hello, {firstName}
                </Text>
                <Text 
                  className="text-neutral-deep text-base"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {dateString}
                </Text>
              </View>
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
                  <Text 
                    className="text-pastel-rose-700 text-sm"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    Logout
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-8 -mx-2"
            >
              <View className="flex-row gap-4 px-2">
                {statsData.map((stat, index) => (
                  <Animated.View
                    key={stat.label}
                    style={{
                      transform: [
                        { 
                          translateY: statsSlideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 30 + (index * 10)],
                          })
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.9}>
                      <LinearGradient
                        colors={stat.color}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text 
                          className="text-white/80 text-xs mb-1"
                          style={{ fontFamily: 'Poppins-Bold' }}
                        >
                          {stat.label}
                        </Text>
                        <View className="flex-row items-baseline gap-1">
                          <Text 
                            className="text-3xl text-white"
                            style={{ fontFamily: 'Poppins-Bold' }}
                          >
                            {stat.value}
                          </Text>
                          <Text className="text-2xl">{stat.icon}</Text>
                        </View>
                        <Text 
                          className="text-white/70 text-xs"
                          style={{ fontFamily: 'Poppins-Medium' }}
                        >
                          {stat.unit}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>

            {/* Main Recording Section */}
            <View className="flex-1 justify-center items-center py-8">
              <Animated.View
                className="items-center"
                style={{
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <Text 
                  className="text-neutral-deep mb-6 text-lg"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  How are you feeling today?
                </Text>
                
                {/* Record Button with Journal Icon */}
                <TouchableOpacity
                  onPress={handleRecordPress}
                  activeOpacity={0.8}
                  className="mb-6"
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: recordButtonScale }],
                    }}
                  >
                    <LinearGradient
                      colors={['#36D592', '#13BC71']}
                      style={styles.recordButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="w-32 h-32 bg-white/20 rounded-full absolute" />
                        <View className="w-24 h-24 bg-white/30 rounded-full absolute" />
                      </View>
                      <Svg width="60" height="60" viewBox="0 0 24 24">
                        <Path
                          d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
                          fill="white"
                        />
                        <Path
                          d="M19 10v1a7 7 0 0 1-14 0v-1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Path
                          d="M12 18v4m-4 0h8"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
                
                <Text 
                  className="text-neutral-dark text-xl mb-2"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Start Recording
                </Text>
                <Text 
                  className="text-neutral-mid text-sm text-center px-12"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  Tap to begin your daily reflection session
                </Text>
              </Animated.View>
            </View>

            {/* Quick Actions */}
            <View className="mb-6">
              <Text 
                className="text-neutral-deep mb-4 text-sm tracking-wide"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                QUICK ACTIONS
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {quickActions.map((action) => (
                  <TouchableOpacity 
                    key={action.label}
                    className="flex-1 min-w-[45%]"
                    activeOpacity={0.8}
                  >
                    <View className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-neutral-light">
                      <View className="flex-row items-center gap-3">
                        <View 
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: action.color + '20' }}
                        >
                          {action.icon}
                        </View>
                        <Text 
                          className="text-neutral-dark text-sm flex-1"
                          style={{ fontFamily: 'Poppins-SemiBold' }}
                        >
                          {action.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="absolute bottom-0 left-0 right-0">
          <BlurView intensity={80} tint="light" style={styles.bottomNav}>
            <View className="flex-row justify-around py-3">
              {[
                { 
                  id: 'home', 
                  icon: (
                    <Svg width="24" height="24" viewBox="0 0 24 24">
                      <Path
                        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
                        stroke={selectedTab === 'home' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="2"
                        fill={selectedTab === 'home' ? '#36D592' : 'none'}
                        opacity={selectedTab === 'home' ? 1 : 0.6}
                      />
                    </Svg>
                  ),
                  label: 'Home'
                },
                {
                  id: 'journal',
                  icon: (
                    <Svg width="24" height="24" viewBox="0 0 24 24">
                      <Path
                        d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
                        stroke={selectedTab === 'journal' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="2"
                        fill="none"
                        opacity={selectedTab === 'journal' ? 1 : 0.6}
                      />
                      <Path
                        d="M14 2V8H20"
                        stroke={selectedTab === 'journal' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="2"
                        opacity={selectedTab === 'journal' ? 1 : 0.6}
                      />
                    </Svg>
                  ),
                  label: 'Journal'
                },
                {
                  id: 'stats',
                  icon: (
                    <Svg width="24" height="24" viewBox="0 0 24 24">
                      <Path
                        d="M18 20V10M12 20V4M6 20v-6"
                        stroke={selectedTab === 'stats' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity={selectedTab === 'stats' ? 1 : 0.6}
                      />
                    </Svg>
                  ),
                  label: 'Stats'
                },
                {
                  id: 'profile',
                  icon: (
                    <Svg width="24" height="24" viewBox="0 0 24 24">
                      <Circle 
                        cx="12" 
                        cy="7" 
                        r="4"
                        stroke={selectedTab === 'profile' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="2"
                        fill="none"
                        opacity={selectedTab === 'profile' ? 1 : 0.6}
                      />
                      <Path
                        d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"
                        stroke={selectedTab === 'profile' ? '#36D592' : '#C5BFD3'}
                        strokeWidth="2"
                        fill="none"
                        opacity={selectedTab === 'profile' ? 1 : 0.6}
                      />
                    </Svg>
                  ),
                  label: 'Profile'
                },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedTab(tab.id)}
                  className="items-center px-4 py-2"
                >
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center mb-1`}
                  >
                    {tab.icon}
                  </View>
                  <Text
                    className={`text-xs ${
                      selectedTab === tab.id
                        ? 'text-pastel-mint-700'
                        : 'text-neutral-mid'
                    }`}
                    style={{ fontFamily: selectedTab === tab.id ? 'Poppins-SemiBold' : 'Poppins-Regular' }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statCard: {
    width: 120,
    padding: 16,
    borderRadius: 20,
    minHeight: 100,
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13BC71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 191, 211, 0.2)',
  },
});

export default HomeScreen;