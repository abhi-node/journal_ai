import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppDispatch, RootState } from '../store';
import { API_CONFIG } from '../config/api';
import { updateUser } from '../store/slices/authSlice';

const { width } = Dimensions.get('window');

const GoalsSetupScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);

  const [currentGoals, setCurrentGoals] = useState('');
  const [yearlyGoals, setYearlyGoals] = useState('');
  const [tenYearVision, setTenYearVision] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Update progress bar
    const progress = currentStep / 3;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);


  const handleSubmit = async () => {
    if (!currentGoals || !yearlyGoals || !tenYearVision) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/users/create_goals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_goals: currentGoals,
          yearly_goals: yearlyGoals,
          ten_year_vision: tenYearVision,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(updateUser(updatedUser));
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.error('Error updating goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="flex-1">
            <Text 
              className="text-3xl text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              What are your current goals?
            </Text>
            <Text 
              className="text-base text-neutral-deep mb-6"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Share what you want to achieve in the next 3-6 months
            </Text>
            <View className="bg-white/80 backdrop-blur rounded-2xl border-2 border-neutral-light p-4">
              <TextInput
                value={currentGoals}
                onChangeText={setCurrentGoals}
                placeholder="e.g., Learn a new skill, improve health habits, strengthen relationships..."
                placeholderTextColor="#C5BFD3"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-neutral-dark text-base min-h-[150px]"
                style={{ fontFamily: 'Poppins-Regular' }}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View className="flex-1">
            <Text 
              className="text-3xl text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Your yearly aspirations
            </Text>
            <Text 
              className="text-base text-neutral-deep mb-6"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              What do you want to accomplish this year?
            </Text>
            <View className="bg-white/80 backdrop-blur rounded-2xl border-2 border-neutral-light p-4">
              <TextInput
                value={yearlyGoals}
                onChangeText={setYearlyGoals}
                placeholder="e.g., Career milestones, personal achievements, travel plans..."
                placeholderTextColor="#C5BFD3"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-neutral-dark text-base min-h-[150px]"
                style={{ fontFamily: 'Poppins-Regular' }}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View className="flex-1">
            <Text 
              className="text-3xl text-neutral-dark mb-3"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Your 10-year vision
            </Text>
            <Text 
              className="text-base text-neutral-deep mb-6"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Where do you see yourself in a decade?
            </Text>
            <View className="bg-white/80 backdrop-blur rounded-2xl border-2 border-neutral-light p-4">
              <TextInput
                value={tenYearVision}
                onChangeText={setTenYearVision}
                placeholder="e.g., Life vision, career position, lifestyle dreams..."
                placeholderTextColor="#C5BFD3"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-neutral-dark text-base min-h-[150px]"
                style={{ fontFamily: 'Poppins-Regular' }}
              />
            </View>
          </View>
        );
    }
  };

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
              top: 50,
              right: -40,
              transform: [{ translateY: floatAnim }],
              opacity: 0.2,
            }}
          >
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Circle cx="60" cy="60" r="50" fill="#36D592" opacity="0.3" />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 150,
              left: -30,
              transform: [{ translateY: Animated.multiply(floatAnim, -0.8) }],
              opacity: 0.2,
            }}
          >
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" fill="#B483F0" opacity="0.3" />
            </Svg>
          </Animated.View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              className="flex-1 px-8 py-6"
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Header */}
              <View className="mb-6">
                <Text 
                  className="text-5xl text-neutral-dark mb-3"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Let's set your goals
                </Text>
                <Text 
                  className="text-lg text-neutral-deep"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Define your journey to success
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="mb-8">
                <View className="flex-row justify-between mb-2">
                  <Text 
                    className="text-xs text-neutral-mid"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Step {currentStep} of 3
                  </Text>
                  <Text 
                    className="text-xs text-neutral-mid"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {Math.round((currentStep / 3) * 100)}% Complete
                  </Text>
                </View>
                <View className="h-2 bg-neutral-light rounded-full overflow-hidden">
                  <Animated.View
                    style={{
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      height: '100%',
                      backgroundColor: '#36D592',
                    }}
                  />
                </View>
              </View>

              {/* Step Content */}
              <View className="flex-1 mb-6">
                {renderStepContent()}
              </View>

              {/* Navigation Buttons */}
              <View className="flex-row gap-4 pb-6">
                {currentStep > 1 && (
                  <TouchableOpacity
                    onPress={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 bg-white/60 backdrop-blur py-4 rounded-3xl border-2 border-neutral-light"
                    activeOpacity={0.7}
                  >
                    <Text 
                      className="text-neutral-deep text-center text-base"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>
                )}

                {currentStep < 3 ? (
                  <TouchableOpacity
                    onPress={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 1 && !currentGoals) ||
                      (currentStep === 2 && !yearlyGoals)
                    }
                    className="flex-1 overflow-hidden rounded-3xl"
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        ((currentStep === 1 && !currentGoals) ||
                         (currentStep === 2 && !yearlyGoals))
                          ? ['#E9E5F0', '#E9E5F0']
                          : ['#36D592', '#13BC71']
                      }
                      style={styles.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text 
                        className="text-white text-base"
                        style={{ fontFamily: 'Poppins-Bold' }}
                      >
                        Continue
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading || !tenYearVision}
                    className="flex-1 overflow-hidden rounded-3xl"
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        loading || !tenYearVision
                          ? ['#E9E5F0', '#E9E5F0']
                          : ['#36D592', '#13BC71']
                      }
                      style={styles.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text 
                          className="text-white text-base"
                          style={{ fontFamily: 'Poppins-Bold' }}
                        >
                          Complete Setup
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoalsSetupScreen;