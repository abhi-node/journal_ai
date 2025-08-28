import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  ActivityIndicator,
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
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  
  const {
    isRecording,
    isProcessing,
    transcription,
    startRecording,
    stopRecording,
    recordingDuration,
  } = useAudioRecording({
    onTranscriptionComplete: (text) => {
      setCurrentTranscription(text);
    },
    onNoteSaved: (noteId, date) => {
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    },
    onError: (error) => {
      console.error('Recording error:', error);
    },
  });
  
  useEffect(() => {
    // Initial animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
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
  
  useEffect(() => {
    if (showRecordingModal) {
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showRecordingModal]);

  const handleRecordPress = async () => {
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
    
    try {
      setShowRecordingModal(true);
      setCurrentTranscription('');
      await startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      setShowRecordingModal(false);
    }
  };
  
  const handleStopRecording = async () => {
    await stopRecording();
    // Keep modal open briefly to show processing state
    // It will close automatically after transcription completes
  };
  
  const handleModalClose = () => {
    // Handle back button or swipe down
    if (isRecording) {
      // Stop recording if active
      stopRecording();
    } else if (!isProcessing) {
      // If not recording or processing, just close the modal
      setShowRecordingModal(false);
    }
  };
  
  useEffect(() => {
    // Close modal when we have a transcription and are not processing
    if (currentTranscription && !isProcessing && !isRecording) {
      setTimeout(() => {
        setShowRecordingModal(false);
        setCurrentTranscription(''); // Clear transcription for next recording
      }, 2000);
    }
  }, [currentTranscription, isProcessing, isRecording]);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

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
    <>
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

          <Animated.View 
            className="flex-1 px-6"
            style={{ opacity: fadeAnim }}
          >
            {/* Header */}
            <View className="pt-6 pb-4">
              <Text 
                className="text-2xl text-neutral-dark/70 mb-1"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Welcome back,
              </Text>
              <Text 
                className="text-3xl text-neutral-dark mb-3"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {firstName}
              </Text>
              <View className="bg-white/50 backdrop-blur self-start px-4 py-2 rounded-full">
                <Text 
                  className="text-neutral-deep text-sm"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {dateString}
                </Text>
              </View>
            </View>

            {/* Main Recording Section */}
            <View className="flex-1 justify-center items-center py-2">
              <Animated.View
                className="items-center"
                style={{
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <Text 
                  className="text-neutral-deep mb-4 text-lg"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  How are you feeling today?
                </Text>
                
                {/* Record Button with Journal Icon */}
                <TouchableOpacity
                  onPress={handleRecordPress}
                  activeOpacity={0.8}
                  className="mb-4"
                  disabled={isRecording || isProcessing}
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
                  className="text-neutral-dark text-lg mb-1"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Start Recording
                </Text>
                <Text 
                  className="text-neutral-mid text-xs text-center px-8"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  Tap to begin your daily reflection
                </Text>
              </Animated.View>
            </View>

            {/* Quick Actions */}
            <View className="mb-24">
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
                    className="basis-[47%]"
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
        </SafeAreaView>
      </LinearGradient>

      {/* Recording Modal */}
      <Modal
        visible={showRecordingModal}
        transparent
        animationType="none"
        onRequestClose={handleModalClose}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: modalFadeAnim,
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(240, 253, 249, 0.95)', 'rgba(250, 248, 254, 0.95)', 'rgba(255, 232, 219, 0.95)']}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="items-center">
              {isProcessing && !isRecording ? (
                <>
                  <ActivityIndicator size="large" color="#36D592" />
                  <Text 
                    className="text-neutral-deep mt-4 text-lg"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Processing audio...
                  </Text>
                </>
              ) : (
                <>
                  <Text 
                    className="text-neutral-deep mb-4 text-xl"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {isRecording ? 'Recording...' : 'Processing...'}
                  </Text>
                  
                  {/* Duration Display */}
                  {isRecording && (
                    <Text 
                      className="text-neutral-deep mb-4 text-2xl"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {recordingDuration}s
                    </Text>
                  )}
                  
                  {/* Audio Waveform Animation */}
                  <View className="mb-8">
                    <AudioWaveform
                      isActive={isRecording}
                      isSpeaking={isRecording}
                      color="#36D592"
                      width={250}
                      height={80}
                    />
                  </View>
                  
                  {/* Transcription Display */}
                  {currentTranscription ? (
                    <View className="bg-white/80 rounded-2xl p-4 mb-6 max-h-40">
                      <ScrollView>
                        <Text 
                          className="text-neutral-deep text-sm"
                          style={{ fontFamily: 'Poppins-Regular' }}
                        >
                          {currentTranscription}
                        </Text>
                      </ScrollView>
                    </View>
                  ) : null}
                  
                  {/* Note Saved Indicator */}
                  {noteSaved && (
                    <View className="bg-green-100 rounded-full px-4 py-2 mb-6">
                      <Text 
                        className="text-green-600 text-sm"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        ✓ Note saved successfully
                      </Text>
                    </View>
                  )}
                  
                  {/* Stop Button */}
                  <TouchableOpacity
                    onPress={handleStopRecording}
                    activeOpacity={0.8}
                    className="bg-red-500 rounded-full px-8 py-4"
                    disabled={!isRecording}
                    style={{ opacity: isRecording ? 1 : 0.5 }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 bg-white rounded-sm mr-2" />
                      <Text 
                        className="text-white text-base"
                        style={{ fontFamily: 'Poppins-SemiBold' }}
                      >
                        Stop Recording
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <Text 
                    className="text-neutral-mid text-xs mt-4 text-center px-8"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Tap to stop when you're finished speaking
                  </Text>
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13BC71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 20,
  },
});

export default HomeScreen;