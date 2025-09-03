import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { signup, clearError } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState(0);

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

    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'GoalsSetup' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  useEffect(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
    Animated.timing(progressAnim, {
      toValue: strength / 5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [password]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Include at least one uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Include at least one lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Include at least one number';
    return '';
  };

  const handleSignup = async () => {
    setValidationError('');
    
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    dispatch(signup({ 
      email: email.trim(), 
      password, 
      name: name.trim(),
      timezone: timezone || 'UTC'
    }));
  };

  const displayError = error || validationError;

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#FF6698';
    if (passwordStrength <= 2) return '#FF9668';
    if (passwordStrength <= 3) return '#FFD4BD';
    if (passwordStrength <= 4) return '#6FE9B5';
    return '#36D592';
  };

  const getPasswordStrengthText = () => {
    if (!password) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    if (passwordStrength <= 4) return 'Strong';
    return 'Excellent';
  };

  return (
    <LinearGradient
      colors={theme.colors.gradients.soft}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Background decorative elements */}
        <View className="absolute inset-0">
          <Animated.View
            style={{
              position: 'absolute',
              top: 50,
              left: -40,
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
              top: 300,
              right: -30,
              transform: [{ translateY: Animated.multiply(floatAnim, -0.8) }],
              opacity: 0.2,
            }}
          >
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" fill="#FF7849" opacity="0.3" />
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              bottom: 150,
              left: width / 2 - 50,
              transform: [{ translateY: floatAnim }],
              opacity: 0.15,
            }}
          >
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Rect x="20" y="20" width="60" height="60" rx="15" fill="#B483F0" opacity="0.3" />
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
              {/* Header with Back Button */}
              <View className="flex-row items-center mb-8">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="p-2 -ml-2"
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={theme.colors.gradients.primary}
                    style={styles.backButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Svg width="20" height="20" viewBox="0 0 20 20">
                      <Path
                        d="M12 4L6 10L12 16"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Title Section */}
              <View className="mb-8">
                <Text 
                  className="text-5xl text-neutral-dark mb-3"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Start your journey
                </Text>
                <Text 
                  className="text-lg text-neutral-deep"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Create your mindful space
                </Text>
              </View>

              {/* Form Section */}
              <View className="flex-1">
                {/* Name Field */}
                <View className="mb-5">
                  <Text className="text-neutral-deep mb-3 font-semibold text-sm tracking-wide">
                    FULL NAME
                  </Text>
                  <View
                    className={`bg-white/80 backdrop-blur rounded-2xl border-2 ${
                      focusedField === 'name' ? 'border-pastel-mint-400' : 'border-neutral-light'
                    } overflow-hidden`}
                  >
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Your full name"
                      placeholderTextColor="#C5BFD3"
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      className="px-5 py-4 text-neutral-dark text-base font-medium"
                    />
                  </View>
                </View>

                {/* Email Field */}
                <View className="mb-5">
                  <Text className="text-neutral-deep mb-3 font-semibold text-sm tracking-wide">
                    EMAIL ADDRESS
                  </Text>
                  <View
                    className={`bg-white/80 backdrop-blur rounded-2xl border-2 ${
                      focusedField === 'email' ? 'border-pastel-mint-400' : 'border-neutral-light'
                    } overflow-hidden`}
                  >
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor="#C5BFD3"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className="px-5 py-4 text-neutral-dark text-base font-medium"
                    />
                  </View>
                </View>

                {/* Password Field with Strength Indicator */}
                <View className="mb-5">
                  <Text className="text-neutral-deep mb-3 font-semibold text-sm tracking-wide">
                    PASSWORD
                  </Text>
                  <View
                    className={`bg-white/80 backdrop-blur rounded-2xl border-2 ${
                      focusedField === 'password' ? 'border-pastel-mint-400' : 'border-neutral-light'
                    } overflow-hidden`}
                  >
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a strong password"
                      placeholderTextColor="#C5BFD3"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className="px-5 py-4 text-neutral-dark text-base font-medium"
                    />
                  </View>
                  {password && (
                    <View className="mt-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-neutral-mid text-xs">
                          Password strength:
                        </Text>
                        <Text 
                          className="text-xs font-semibold"
                          style={{ color: getPasswordStrengthColor() }}
                        >
                          {getPasswordStrengthText()}
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
                            backgroundColor: getPasswordStrengthColor(),
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Confirm Password Field */}
                <View className="mb-6">
                  <Text className="text-neutral-deep mb-3 font-semibold text-sm tracking-wide">
                    CONFIRM PASSWORD
                  </Text>
                  <View
                    className={`bg-white/80 backdrop-blur rounded-2xl border-2 ${
                      focusedField === 'confirmPassword' ? 'border-pastel-mint-400' : 'border-neutral-light'
                    } overflow-hidden`}
                  >
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#C5BFD3"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      className="px-5 py-4 text-neutral-dark text-base font-medium"
                    />
                  </View>
                  {confirmPassword && password !== confirmPassword && (
                    <Text className="text-pastel-rose-600 text-xs mt-2 px-1">
                      Passwords don't match
                    </Text>
                  )}
                </View>

                {/* Error Message */}
                {displayError && (
                  <Animated.View
                    className="bg-pastel-rose-50 border border-pastel-rose-200 rounded-2xl p-4 mb-6"
                    style={{
                      transform: [{ scale: pulseAnim }],
                    }}
                  >
                    <Text className="text-pastel-rose-700 text-center text-sm font-medium">
                      {displayError}
                    </Text>
                  </Animated.View>
                )}

                {/* Create Account Button */}
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <TouchableOpacity
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.85}
                    className="overflow-hidden rounded-3xl mb-6"
                  >
                    <LinearGradient
                      colors={loading ? [theme.colors.accent, theme.colors.accent] : theme.colors.gradients.primary}
                      style={styles.signupButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white text-lg font-bold">
                          Create My Account
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Terms and Privacy */}
                <Text className="text-neutral-mid text-xs text-center mb-6 px-4">
                  By creating an account, you agree to our{' '}
                  <Text className="text-pastel-lavender-600 font-semibold">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-pastel-lavender-600 font-semibold">Privacy Policy</Text>
                </Text>

                {/* Sign In Section */}
                <View className="items-center pb-8">
                  <Text className="text-neutral-deep mb-4 text-base">
                    Already have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    className="bg-white/40 backdrop-blur px-8 py-3 rounded-3xl border-2 border-pastel-lavender-300"
                    activeOpacity={0.7}
                  >
                    <Text className="text-pastel-lavender-700 font-bold text-base">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignupScreen;