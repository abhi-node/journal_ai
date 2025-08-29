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
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AudioWaveform from '../components/AudioWaveform';
import { useAudioRecording } from '../hooks/useAudioRecording';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
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
      showStatus('Saved successfully');
    },
    onNoteSaved: () => {
      // Additional confirmation
    },
    onError: (error) => {
      showStatus('Failed to save');
      console.error('Recording error:', error);
    },
  });
  
  useEffect(() => {
    // Clean up any existing animations first
    animationCleanupRef.current.forEach(cleanup => cleanup());
    animationCleanupRef.current = [];
    
    // Initial fade in sequence
    const fadeInSequence = Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(instructionAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);
    fadeInSequence.start();
    
    // Setup pulse animation with proper cleanup
    const setupPulseAnimation = () => {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
      }
      
      pulseAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationRef.current.start();
    };
    
    // Start pulse after a delay
    const pulseTimeout = setTimeout(() => {
      if (!isHolding) {
        setupPulseAnimation();
      }
    }, 800);

    // Float animation for background elements
    const floatAnimation = Animated.loop(
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
    );
    floatAnimation.start();

    // Store cleanup functions
    animationCleanupRef.current = [
      () => {
        pulseAnimationRef.current?.stop();
        floatAnimation.stop();
        clearTimeout(pulseTimeout);
      }
    ];

    return () => {
      animationCleanupRef.current.forEach(cleanup => cleanup());
    };
  }, []);
  
  const showStatus = (message: string) => {
    setStatusMessage(message);
    setShowStatusMessage(true);
    
    Animated.sequence([
      Animated.timing(statusMessageAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(statusMessageAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowStatusMessage(false);
      setStatusMessage('');
    });
  };
  
  const startRecordingAnimation = useCallback(() => {
    // Stop pulse animation safely
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    
    // Reset values before starting
    recordButtonScale.setValue(1);
    rippleAnim.setValue(0);
    rippleOpacity.setValue(0.3);
    
    // Scale up button
    Animated.spring(recordButtonScale, {
      toValue: 1.1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Start ripple effect with proper cleanup
    if (rippleAnimationRef.current) {
      rippleAnimationRef.current.stop();
    }
    
    rippleAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 2.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    rippleAnimationRef.current.start();
    
    // Fade in recording indicator
    Animated.timing(recordingIndicatorAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [recordButtonScale, rippleAnim, rippleOpacity, recordingIndicatorAnim]);
  
  const stopRecordingAnimation = useCallback(() => {
    // Scale back button
    Animated.spring(recordButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Stop and reset ripple safely
    if (rippleAnimationRef.current) {
      rippleAnimationRef.current.stop();
      rippleAnimationRef.current = null;
    }
    
    Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Fade out recording indicator
    Animated.timing(recordingIndicatorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Restart pulse animation with proper check
    const restartTimeout = setTimeout(() => {
      if (!isHolding && !pulseAnimationRef.current) {
        pulseAnimationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.03,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimationRef.current.start();
      }
    }, 500);
    
    // Store timeout for cleanup
    animationCleanupRef.current.push(() => clearTimeout(restartTimeout));
  }, [recordButtonScale, rippleAnim, rippleOpacity, recordingIndicatorAnim, pulseAnim, isHolding]);

  const handlePressIn = async () => {
    setIsHolding(true);
    Vibration.vibrate(10);
    
    try {
      await startRecording();
      startRecordingAnimation();
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsHolding(false);
      showStatus('Failed to start');
    }
  };
  
  const handlePressOut = async () => {
    if (!isHolding || !isRecording) return;
    
    setIsHolding(false);
    Vibration.vibrate(10);
    stopRecordingAnimation();
    
    try {
      await stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      showStatus('Failed to save');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';

  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Subtle Background Elements */}
        <View className="absolute inset-0" pointerEvents="none">
          <Animated.View
            style={{
              position: 'absolute',
              top: height * 0.15,
              right: -80,
              transform: [{ translateY: floatAnim }],
              opacity: 0.05,
            }}
          >
            <Svg width="250" height="250" viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="80" fill="#36D592" />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: height * 0.2,
              left: -60,
              transform: [{ translateY: Animated.multiply(floatAnim, -1) }],
              opacity: 0.05,
            }}
          >
            <Svg width="200" height="200" viewBox="0 0 150 150">
              <Circle cx="75" cy="75" r="60" fill="#B483F0" />
            </Svg>
          </Animated.View>
        </View>

        <Animated.View 
          className="flex-1"
          style={{ opacity: fadeAnim }}
        >
          {/* Main Content Area - Centered */}
          <View className="flex-1 justify-center items-center px-6">
            {/* Welcome Section */}
            <Animated.View 
              className="items-center mb-8"
              style={{ 
                opacity: welcomeAnim,
                transform: [{
                  translateY: welcomeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }}
            >
              <Text 
                className="text-3xl text-neutral-dark mb-2 text-center"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Welcome back, {firstName}
              </Text>
              <Text 
                className="text-lg text-neutral-dark/60 text-center"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {greeting}
              </Text>
            </Animated.View>

            {/* Simple Instructions */}
            <Animated.View 
              className="mb-10"
              style={{ 
                opacity: instructionAnim,
                transform: [{
                  translateY: instructionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0]
                  })
                }]
              }}
            >
              <Text 
                className="text-center text-neutral-dark/50 text-sm"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Hold the button to record • Release to save
              </Text>
            </Animated.View>

            {/* Recording Button Section */}
            <View className="items-center">
              {/* Recording Button Container */}
              <View className="items-center justify-center mb-8">
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
                      colors={isHolding ? ['#FF6B6B', '#FF4444'] : ['#36D592', '#13BC71']}
                      style={styles.recordButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="w-36 h-36 bg-white/10 rounded-full absolute" />
                        <View className="w-28 h-28 bg-white/20 rounded-full absolute" />
                      </View>
                      <Svg width="72" height="72" viewBox="0 0 24 24">
                        {isHolding ? (
                          // Stop icon
                          <Rect
                            x="6"
                            y="6"
                            width="12"
                            height="12"
                            rx="3"
                            fill="white"
                          />
                        ) : (
                          // Microphone icon
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
                
                {/* Recording Duration Indicator */}
                {isHolding && (
                  <Animated.View
                    style={[
                      styles.recordingIndicator,
                      {
                        opacity: recordingIndicatorAnim,
                      }
                    ]}
                  >
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-red-500 rounded-full mr-2">
                        <Animated.View
                          className="w-2 h-2 bg-red-500 rounded-full"
                          style={{
                            opacity: recordingIndicatorAnim,
                          }}
                        />
                      </View>
                      <Text 
                        className="text-red-500 text-sm"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {recordingDuration}s
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
              
              {/* Waveform Visualization */}
              {isHolding && (
                <View className="absolute" style={{ bottom: -80 }}>
                  <AudioWaveform
                    isActive={isRecording}
                    isSpeaking={isRecording}
                    color="#FF6B6B"
                    width={280}
                    height={60}
                  />
                </View>
              )}
              
              {/* Recording Status */}
              <Text 
                className="text-neutral-dark text-lg mt-4"
                style={{ 
                  fontFamily: 'Poppins-Medium'
                }}
              >
                {isHolding ? 'Release to save' : 'Hold to record'}
              </Text>
            </View>
            
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
                <View className={`${statusMessage.includes('success') ? 'bg-green-500' : 'bg-neutral-800'} rounded-full px-5 py-2.5`}>
                  <Text 
                    className="text-white text-sm"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {statusMessage}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
          
          {/* Bottom Info */}
          <Animated.View 
            className="px-6 pb-8"
            style={{ opacity: fadeAnim }}
          >
            <Text 
              className="text-center text-neutral-dark/50 text-xs"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Your recordings are processed in the background
            </Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  ripple: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF6B6B',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -45,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statusMessage: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
  },
});

export default HomeScreen;