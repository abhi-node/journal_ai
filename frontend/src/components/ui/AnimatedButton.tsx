import React, { useRef } from 'react';
import { 
  Animated, 
  Pressable, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  loading = false,
  icon,
  disabled = false,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        };
      case 'large':
        return {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          borderRadius: theme.borderRadius.xl,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.borderRadius.lg,
        };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: theme.typography.fontSize.sm,
        };
      case 'large':
        return {
          fontSize: theme.typography.fontSize.lg,
        };
      default:
        return {
          fontSize: theme.typography.fontSize.md,
        };
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.gradients.secondary;
      case 'accent':
        return theme.colors.gradients.accent;
      case 'ghost':
        return [theme.colors.surface, theme.colors.surface];
      default:
        return theme.colors.gradients.primary;
    }
  };

  const getTextColor = () => {
    return variant === 'ghost' ? theme.colors.text.primary : theme.colors.text.inverse;
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text 
            style={[
              styles.text,
              getTextSize(),
              { 
                color: getTextColor(),
                fontFamily: theme.typography.fontFamily.medium,
                marginLeft: icon ? theme.spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : opacityAnim,
        },
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
        {...props}
      >
        {variant === 'ghost' ? (
          <Animated.View 
            style={[
              styles.button,
              getSizeStyles(),
              {
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.accent,
              },
            ]}
          >
            {buttonContent}
          </Animated.View>
        ) : (
          <LinearGradient
            colors={getVariantColors()}
            style={[
              styles.button,
              getSizeStyles(),
              styles.elevated,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {buttonContent}
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  elevated: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});