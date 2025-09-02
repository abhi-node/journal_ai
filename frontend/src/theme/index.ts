// Centralized Theme System
export const theme = {
  colors: {
    // Primary Monochrome Palette
    primary: '#2C2C2C',      // Deep charcoal (primary actions)
    secondary: '#6B6B6B',    // Medium gray (secondary elements)
    accent: '#E5E5E5',       // Light gray (accents)
    background: '#FAFAFA',   // Off-white (backgrounds)
    
    // Extended Palette
    surface: '#FFFFFF',      // Cards and surfaces
    surfaceLight: '#F8F8F8', // Light surfaces
    
    // Text Colors
    text: {
      primary: '#1A1A1A',    // Main text
      secondary: '#6B6B6B',  // Secondary text
      light: '#9A9A9A',      // Light text
      inverse: '#FFFFFF',    // Text on dark backgrounds
    },
    
    // Semantic Colors with subtle hues
    success: '#7DC383',      // Soft green
    warning: '#F5C99B',      // Soft orange
    error: '#E8A0A0',        // Soft red
    info: '#98A1BC',         // Info blue
    
    // Gradient Combinations - subtle gradients
    gradients: {
      primary: ['#2C2C2C', '#404040'],
      secondary: ['#6B6B6B', '#8A8A8A'],
      accent: ['#E5E5E5', '#F2F2F2'],
      soft: ['#FFFFFF', '#FAFAFA'],
      card: ['#FFFFFF', '#FAFAFA'],
    },
    
    // Shadows and Overlays
    shadow: 'rgba(0, 0, 0, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.03)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  
  typography: {
    fontFamily: {
      thin: 'Outfit-Thin',
      extralight: 'Outfit-ExtraLight',
      light: 'Outfit-Light',
      regular: 'Outfit-Light',  // Using Light as default for cleaner look
      medium: 'Outfit-Regular',
      semibold: 'Outfit-Medium',
      bold: 'Outfit-SemiBold',
      extrabold: 'Outfit-Bold',
      black: 'Outfit-Black',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 40,
    },
  },
  
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#555879',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#555879',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#555879',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#555879',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};

// Material Design 3 inspired elevation system
export const elevation = (level: number) => {
  const baseOpacity = 0.04;
  const opacityIncrement = 0.01;
  return {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: level },
    shadowOpacity: baseOpacity + (level * opacityIncrement),
    shadowRadius: level * 2,
    elevation: level,
  };
};