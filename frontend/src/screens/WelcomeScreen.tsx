import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
              top: -50,
              right: -50,
              transform: [
                { translateY: floatAnim },
              ],
              opacity: 0.2,
            }}
          >
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="80" fill={theme.colors.primary} opacity="0.1" />
              <Circle cx="100" cy="100" r="60" fill={theme.colors.secondary} opacity="0.05" />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              transform: [
                { translateY: Animated.multiply(floatAnim, -1) },
              ],
              opacity: 0.2,
            }}
          >
            <Svg width="300" height="300" viewBox="0 0 300 300">
              <Circle cx="150" cy="150" r="120" fill={theme.colors.secondary} opacity="0.08" />
              <Circle cx="150" cy="150" r="80" fill={theme.colors.primary} opacity="0.05" />
            </Svg>
          </Animated.View>
        </View>

        <View className="flex-1 justify-between px-8 py-12">
          {/* Top spacer */}
          <View className="flex-1" />
          
          {/* Main content centered */}
          <View className="flex-2 items-center justify-center">
            {/* Logo/Title Section */}
            <Animated.View 
              className="items-center mb-12"
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              }}
            >
              {/* App Icon/Logo */}
              <View className="mb-6">
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Svg width="60" height="60" viewBox="0 0 24 24">
                    <Path
                      d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <Path
                      d="M14 2V8H20"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M8 13H16M8 17H16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </LinearGradient>
              </View>
              
              <Text 
                className="text-6xl text-neutral-dark text-center mb-4"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                JournalAI
              </Text>
              <Text 
                className="text-lg text-neutral-deep text-center px-4"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Your mindful companion for daily reflection
              </Text>
            </Animated.View>

            {/* Tagline with animated gradient text */}
            <Animated.View 
              className="items-center mb-16 px-6"
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 0.8) }],
              }}
            >
              <View className="bg-white/30 backdrop-blur-lg rounded-3xl p-6">
                <Text 
                  className="text-xl text-center text-neutral-deep leading-relaxed"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Speak freely.{'\n'}
                  Gain clarity.{'\n'}
                  Transform daily.
                </Text>
              </View>
            </Animated.View>

            {/* Get Started Button with gradient */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateY: Animated.multiply(slideAnim, 0.6) },
                  { scale: scaleAnim },
                ],
              }}
              className="w-full max-w-xs"
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
                className="overflow-hidden rounded-3xl"
              >
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    Begin Your Journey
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary action */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text 
                  className="text-neutral-deep text-base"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  I already have an account
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Bottom section with animated dots */}
          <View className="flex-1 justify-end items-center pb-6">
            <Animated.View 
              className="flex-row gap-3"
              style={{ opacity: fadeAnim }}
            >
              <Animated.View
                style={{
                  transform: [{ translateY: floatAnim }],
                }}
              >
                <View className="w-3 h-3 rounded-full bg-pastel-mint-400" />
              </Animated.View>
              <Animated.View
                style={{
                  transform: [{ translateY: Animated.multiply(floatAnim, -0.5) }],
                }}
              >
                <View className="w-3 h-3 rounded-full bg-pastel-lavender-400" />
              </Animated.View>
              <Animated.View
                style={{
                  transform: [{ translateY: floatAnim }],
                }}
              >
                <View className="w-3 h-3 rounded-full bg-pastel-peach-400" />
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen;