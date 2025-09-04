import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
  ScrollView,
  ColorValue,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { theme, elevation } from '../theme';
import { FloatingElement } from '../components/ui';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const recordingIndicatorAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const statusMessageAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const instructionAnim = useRef(new Animated.Value(0)).current;
  
  const [isHolding, setIsHolding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rippleAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const animationCleanupRef = useRef<(() => void)[]>([]);
  
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    recordingDuration,
  } = useAudioRecording({
    onTranscriptionComplete: () => {
      showStatus('Note saved successfully');
    },
    onTranscriptionError: () => {
      showStatus('Failed to save note');
    }
  });

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setShowStatusMessage(true);
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(statusMessageAnim, {
          toValue: 1,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000),
      Animated.timing(statusMessageAnim, {
        toValue: 0,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowStatusMessage(false);
    });
  }, [statusMessageAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const animations = [];
    
    // Welcome animation
    const welcomeAnimation = Animated.sequence([
      Animated.delay(100),
      Animated.spring(welcomeAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);
    
    // Instruction animation
    const instructionAnimation = Animated.sequence([
      Animated.delay(400),
      Animated.timing(instructionAnim, {
        toValue: 1,
        duration: theme.animation.duration.slow,
        useNativeDriver: true,
      }),
    ]);
    
    // Fade in animation
    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: theme.animation.duration.slow,
      delay: 600,
      useNativeDriver: true,
    });
    
    // Pulse animation
    const createPulseAnimation = () => {
      const animation = Animated.loop(
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
      );
      pulseAnimationRef.current = animation;
      return animation;
    };
    
    Animated.parallel([
      welcomeAnimation,
      instructionAnimation,
      fadeAnimation,
      createPulseAnimation(),
    ]).start();
    
    return () => {
      pulseAnimationRef.current?.stop();
      rippleAnimationRef.current?.stop();
      animationCleanupRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    startRecording();
    Vibration.vibrate(10);
    
    // Stop pulse animation
    pulseAnimationRef.current?.stop();
    
    // Scale animation
    Animated.spring(recordButtonScale, {
      toValue: 0.9,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
    
    // Recording indicator animation
    Animated.timing(recordingIndicatorAnim, {
      toValue: 1,
      duration: theme.animation.duration.fast,
      useNativeDriver: true,
    }).start();
    
    // Ripple animation
    const rippleAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(rippleAnim, {
          toValue: 2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rippleOpacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    rippleAnimationRef.current = rippleAnimation;
    rippleAnimation.start();
  }, [startRecording]);

  const handlePressOut = useCallback(() => {
    if (!isHolding) return;
    
    setIsHolding(false);
    stopRecording();
    Vibration.vibrate(10);
    
    // Stop ripple animation
    rippleAnimationRef.current?.stop();
    
    // Immediately reset ripple values to avoid freeze
    rippleAnim.setValue(0);
    rippleOpacity.setValue(0);
    
    // Reset animations
    Animated.parallel([
      Animated.spring(recordButtonScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(recordingIndicatorAnim, {
        toValue: 0,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Restart pulse animation
      const pulseAnimation = Animated.loop(
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
      );
      pulseAnimationRef.current = pulseAnimation;
      pulseAnimation.start();
    });
  }, [isHolding, stopRecording]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.soft as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Animated.View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.welcomeContainer,
                {
                  opacity: welcomeAnim,
                  transform: [{
                    scale: welcomeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.welcomeCard}>
                <Text style={styles.greeting}>
                  Welcome back
                </Text>
                <Text style={styles.userName}>
                  {user?.name || 'Friend'}
                </Text>
              </View>
            </Animated.View>
          </View>
          
          {/* Main Recording Section */}
          <View style={styles.mainSection}>
            
            
            {/* Instruction */}
            <Animated.View 
              style={[
                styles.instructionContainer,
                { 
                  opacity: instructionAnim,
                  transform: [{
                    translateY: instructionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.instruction}>
                Hold to record
              </Text>
            </Animated.View>

            {/* Recording Button */}
            <View style={styles.buttonContainer}>
              {/* Ripple Effect */}
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    transform: [{ scale: rippleAnim }],
                    opacity: rippleOpacity,
                  }
                ]}
              />
              
              {/* Main Record Button */}
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                delayLongPress={0}
                disabled={isProcessing}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.95 : 1,
                  }
                ]}
              >
                <Animated.View
                  style={{
                    transform: [{ 
                      scale: isHolding ? recordButtonScale : pulseAnim 
                    }],
                  }}
                >
                  <LinearGradient
                    colors={(isHolding ? 
                      [theme.colors.error, '#D68080'] : 
                      [theme.colors.primary, theme.colors.secondary]
                    ) as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
                    style={styles.recordButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.buttonInner}>
                      <View style={styles.buttonRing1} />
                      <View style={styles.buttonRing2} />
                    </View>
                    <Svg width="70" height="70" viewBox="0 0 24 24">
                      {isHolding ? (
                        <Rect
                          x="7"
                          y="7"
                          width="10"
                          height="10"
                          rx="2"
                          fill="white"
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </Svg>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </View>

            {/* Button Label */}
            <Text 
              style={[
                styles.buttonLabel,
                { color: isHolding ? theme.colors.error : theme.colors.text.secondary }
              ]}
            >
              {isHolding ? 'Release to save' : isProcessing ? 'Processing...' : ''}
            </Text>
            
            {/* Status Message */}
            {showStatusMessage && (
              <Animated.View
                style={[
                  styles.statusMessage,
                  {
                    opacity: statusMessageAnim,
                    transform: [
                      {
                        translateY: statusMessageAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>
                    {statusMessage}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  welcomeContainer: {
    marginBottom: theme.spacing.xl,
  },
  welcomeCard: {
    // Simple container with no special borders or backgrounds
  },
  greeting: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.light,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  userName: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  mainSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Add padding to move content up
  },
  instructionContainer: {
    marginBottom: theme.spacing.xxl * 1.5,
  },
  instruction: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  ripple: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: theme.colors.primary,
  },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation(8),
  },
  buttonInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRing1: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
  },
  buttonRing2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute',
  },
  buttonLabel: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    height: 20,
  },
  statusMessage: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  statusCard: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...elevation(4),
  },
  statusText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.success,
  },
});

export default HomeScreen;