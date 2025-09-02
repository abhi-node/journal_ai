import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';
import { theme } from '../theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import SkillsScreen from '../screens/SkillsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.light,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(250,250,250,0.95)',
              borderTopWidth: 1,
              borderTopColor: theme.colors.accent,
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontFamily: theme.typography.fontFamily.regular,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
                stroke={color}
                strokeWidth="2"
                fill={focused ? color : 'none'}
                opacity={focused ? 1 : 0.6}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity={focused ? 1 : 0.6}
              />
              <Path
                d="M14 2V8H20"
                stroke={color}
                strokeWidth="2"
                opacity={focused ? 1 : 0.6}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Skills"
        component={SkillsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke={color}
                strokeWidth="2"
                fill={focused ? color : 'none'}
                opacity={focused ? 1 : 0.6}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Circle 
                cx="12" 
                cy="7" 
                r="4"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity={focused ? 1 : 0.6}
              />
              <Path
                d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity={focused ? 1 : 0.6}
              />
            </Svg>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;