import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OnboardingScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Onboarding - Goals Setup</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingScreen;