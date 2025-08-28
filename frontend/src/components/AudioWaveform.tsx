import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface AudioWaveformProps {
  isActive: boolean;
  isSpeaking: boolean;
  color?: string;
  barCount?: number;
  width?: number;
  height?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  isSpeaking,
  color = '#36D592',
  barCount = 5,
  width = 200,
  height = 60,
}) => {
  const animations = useRef(
    Array.from({ length: barCount }, () => useSharedValue(0.3))
  ).current;

  useEffect(() => {
    if (isActive && isSpeaking) {
      // Start animations with different delays for each bar
      animations.forEach((animation, index) => {
        animation.value = withRepeat(
          withSequence(
            withDelay(
              index * 100,
              withTiming(1, {
                duration: 300 + Math.random() * 200,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            withTiming(0.3, {
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      });
    } else if (isActive && !isSpeaking) {
      // Gentle idle animation when recording but not speaking
      animations.forEach((animation, index) => {
        animation.value = withRepeat(
          withSequence(
            withDelay(
              index * 150,
              withTiming(0.5, {
                duration: 800,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            withTiming(0.3, {
              duration: 800,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      });
    } else {
      // Stop animations
      animations.forEach((animation) => {
        animation.value = withTiming(0.3, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
      });
    }
  }, [isActive, isSpeaking, animations]);

  const barWidth = width / (barCount * 2 - 1);

  return (
    <View style={[styles.container, { width, height }]}>
      {animations.map((animation, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const barHeight = interpolate(
            animation.value,
            [0, 1],
            [height * 0.2, height]
          );

          const opacity = interpolate(
            animation.value,
            [0.3, 1],
            [0.6, 1]
          );

          return {
            height: barHeight,
            opacity,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              animatedStyle,
              {
                width: barWidth,
                backgroundColor: color,
                marginHorizontal: index > 0 ? barWidth / 2 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 3,
  },
});

export default AudioWaveform;