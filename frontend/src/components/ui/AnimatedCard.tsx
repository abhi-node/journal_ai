import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Animated, 
  Pressable, 
  StyleSheet, 
  ViewStyle,
  PressableProps,
} from 'react-native';
import { theme, elevation } from '../../theme';

interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
  animationType?: 'scale' | 'fade' | 'slide' | 'bounce';
  delay?: number;
  disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  variant = 'elevated',
  animationType = 'scale',
  delay = 0,
  disabled = false,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = [];

    // Entry animation based on type
    switch (animationType) {
      case 'scale':
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
            delay,
          })
        );
        break;
      case 'slide':
        animations.push(
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: theme.animation.duration.normal,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: theme.animation.duration.normal,
              useNativeDriver: true,
              delay,
            }),
          ])
        );
        break;
      case 'bounce':
        animations.push(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.05,
              duration: theme.animation.duration.fast,
              useNativeDriver: true,
              delay,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 4,
              tension: 40,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      default:
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: theme.animation.duration.normal,
            useNativeDriver: true,
            delay,
          })
        );
    }

    // Always fade in
    if (animationType !== 'slide') {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
          delay,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [animationType, delay]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.96,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      overflow: 'hidden' as 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...elevation(4),
          ...style,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme.colors.accent,
          ...style,
        };
      case 'flat':
      default:
        return {
          ...baseStyle,
          ...style,
        };
    }
  };

  const getAnimatedStyle = () => {
    let transforms: any[] = [];

    switch (animationType) {
      case 'scale':
        transforms = [{ scale: Animated.multiply(pressAnim, scaleAnim) }];
        break;
      case 'slide':
        transforms = [{ scale: pressAnim }, { translateY: slideAnim }];
        break;
      case 'bounce':
        transforms = [{ scale: Animated.multiply(pressAnim, scaleAnim) }];
        break;
      default:
        transforms = [{ scale: pressAnim }];
        break;
    }

    return {
      opacity: fadeAnim,
      transform: transforms,
    };
  };

  if (onPress) {
    return (
      <Animated.View style={getAnimatedStyle()}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          {...props}
        >
          <View style={getCardStyle()}>
            {children}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[getCardStyle(), getAnimatedStyle()]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});