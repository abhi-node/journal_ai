import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#36D592',
        tabBarInactiveTintColor: '#C5BFD3',
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
              backgroundColor: 'rgba(255,255,255,0.85)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(197, 191, 211, 0.15)',
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
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
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M18 20V10M12 20V4M6 20v-6"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
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