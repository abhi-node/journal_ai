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
import { login, clearError } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

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
              right: -50,
              transform: [{ translateY: floatAnim }],
              opacity: 0.2,
            }}
          >
            <Svg width="150" height="150" viewBox="0 0 150 150">
              <Circle cx="75" cy="75" r="60" fill="#B483F0" opacity="0.3" />
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
              <Circle cx="50" cy="50" r="40" fill="#36D592" opacity="0.3" />
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
                    colors={['#36D592', '#13BC71']}
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
                  className="text-5xl text-neutral-dark mb-3"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Welcome back
                </Text>
                <Text 
                  className="text-lg text-neutral-deep"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Continue your mindful journey
                </Text>
              </View>

              {/* Form Section */}
              <View className="flex-1">
                {/* Email Field */}
                <View className="mb-6">
                  <Text 
                    className="text-neutral-deep mb-3 text-sm tracking-wide"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
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
                      className="px-5 py-4 text-neutral-dark text-base"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View className="mb-8">
                  <Text 
                    className="text-neutral-deep mb-3 text-sm tracking-wide"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
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
                      placeholder="Enter your password"
                      placeholderTextColor="#C5BFD3"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className="px-5 py-4 text-neutral-dark text-base"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    />
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="mb-8"
                >
                  <Text 
                    className="text-pastel-mint-600 text-base text-right"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Forgot your password?
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error && (
                  <Animated.View
                    className="bg-pastel-rose-50 border border-pastel-rose-200 rounded-2xl p-4 mb-6"
                    style={{
                      transform: [{ scale: pulseAnim }],
                    }}
                  >
                    <Text 
                      className="text-pastel-rose-700 text-center text-sm"
                      style={{ fontFamily: 'Poppins-Medium' }}
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
                      colors={
                        loading || !email.trim() || !password
                          ? ['#E9E5F0', '#E9E5F0']
                          : ['#36D592', '#13BC71']
                      }
                      style={styles.loginButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text 
                          className="text-white text-lg"
                          style={{ fontFamily: 'Poppins-Bold' }}
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
                    className="text-neutral-deep mb-4 text-base"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    New to JournalAI?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Signup')}
                    className="bg-white/40 backdrop-blur px-8 py-3 rounded-3xl border-2 border-pastel-lavender-300"
                    activeOpacity={0.7}
                  >
                    <Text 
                      className="text-pastel-lavender-700 text-base"
                      style={{ fontFamily: 'Poppins-Bold' }}
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
});

export default LoginScreen;