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
  ColorValue,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
        routes: [{ name: 'Home' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (email.trim() && password) {
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
      
      dispatch(login({ email: email.trim(), password }));
    }
  };

  return (
    <LinearGradient
      colors={theme.colors.gradients.soft as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
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
              top: 100,
              right: -50,
              transform: [{ translateY: floatAnim }],
              opacity: 0.2,
            }}
          >
            <Svg width="150" height="150" viewBox="0 0 150 150">
              <Circle cx="75" cy="75" r="60" fill={theme.colors.secondary} opacity="0.1" />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 200,
              left: -30,
              transform: [{ translateY: Animated.multiply(floatAnim, -0.5) }],
              opacity: 0.2,
            }}
          >
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" fill={theme.colors.primary} opacity="0.1" />
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
              <View className="flex-row items-center mb-10">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="p-2 -ml-2"
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={theme.colors.gradients.primary as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
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
              <View className="mb-12">
                <Text 
                  style={[styles.title, { fontFamily: theme.typography.fontFamily.bold }]}
                >
                  Welcome back
                </Text>
                <Text 
                  style={[styles.subtitle, { fontFamily: theme.typography.fontFamily.medium }]}
                >
                  Continue your mindful journey
                </Text>
              </View>

              {/* Form Section */}
              <View className="flex-1">
                {/* Email Field */}
                <View className="mb-6">
                  <Text 
                    style={[styles.label, { fontFamily: theme.typography.fontFamily.semibold }]}
                  >
                    EMAIL ADDRESS
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'email' && styles.inputContainerFocused
                    ]}
                  >
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={theme.colors.text.light}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      style={[styles.input, { fontFamily: theme.typography.fontFamily.medium }]}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View className="mb-8">
                  <Text 
                    style={[styles.label, { fontFamily: theme.typography.fontFamily.semibold }]}
                  >
                    PASSWORD
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'password' && styles.inputContainerFocused
                    ]}
                  >
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.colors.text.light}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      style={[styles.input, { fontFamily: theme.typography.fontFamily.medium }]}
                    />
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="mb-8"
                >
                  <Text 
                    style={[styles.forgotPassword, { fontFamily: theme.typography.fontFamily.medium }]}
                  >
                    Forgot your password?
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error && (
                  <Animated.View
                    style={[
                      styles.errorContainer,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <Text 
                      style={[styles.errorText, { fontFamily: theme.typography.fontFamily.medium }]}
                    >
                      {error}
                    </Text>
                  </Animated.View>
                )}

                {/* Login Button */}
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading || !email.trim() || !password}
                    activeOpacity={0.85}
                    className="overflow-hidden rounded-3xl mb-8"
                  >
                    <LinearGradient
                      colors={(
                        loading || !email.trim() || !password
                          ? [theme.colors.accent, theme.colors.accent]
                          : theme.colors.gradients.primary
                      ) as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
                      style={styles.loginButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text 
                          style={[styles.buttonText, { fontFamily: theme.typography.fontFamily.bold }]}
                        >
                          Sign In
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign Up Section */}
                <View className="items-center pb-8">
                  <Text 
                    style={[styles.signupPrompt, { fontFamily: theme.typography.fontFamily.regular }]}
                  >
                    New to Momentum?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Signup')}
                    style={styles.signupButton}
                    activeOpacity={0.7}
                  >
                    <Text 
                      style={[styles.signupButtonText, { fontFamily: theme.typography.fontFamily.bold }]}
                    >
                      Create Account
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
  loginButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl + 8,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
  },
  input: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  forgotPassword: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
  },
  signupPrompt: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  signupButton: {
    backgroundColor: theme.colors.surface + '40',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  signupButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
});

export default LoginScreen;
