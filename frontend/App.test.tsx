import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F0' }}>
      <Text style={{ fontSize: 24, color: '#333' }}>App is rendering!</Text>
      <StatusBar style="auto" />
    </View>
  );
}