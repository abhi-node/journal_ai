import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const StatsScreen = () => {
  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6">
          <Text 
            className="text-3xl text-neutral-dark mb-4"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Statistics
          </Text>
          <View className="flex-1 justify-center items-center">
            <Text 
              className="text-lg text-neutral-deep text-center"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Your progress and insights will appear here
            </Text>
            <Text 
              className="text-sm text-neutral-mid text-center mt-2"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Coming soon
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default StatsScreen;