import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GoalsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Goals Screen - Manage Goals</Text>
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

export default GoalsScreen;