import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface FloatingElementProps {
  children: React.ReactNode;
  floatRange?: number;
  duration?: number;
  delay?: number;
  disabled?: boolean;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  floatRange = 10,
  duration = 3000,
  delay = 0,
  disabled = false,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!disabled) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: floatRange,
            duration: duration / 2,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      
      return () => animation.stop();
    }
  }, [disabled, floatRange, duration, delay]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: floatAnim,
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};