import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { store, RootState, AppDispatch } from './src/store';
import { loadStoredAuth } from './src/store/slices/authSlice';
import './global.css';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import GoalsSetupScreen from './src/screens/GoalsSetupScreen';
import NoteDetailScreen from './src/screens/NoteDetailScreen';
import ReviewDetailScreen from './src/screens/ReviewDetailScreen';
import TabNavigator from './src/navigation/TabNavigator';

const Stack = createStackNavigator();

function RootNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    console.log('Loading stored auth...');
    dispatch(loadStoredAuth());
  }, [dispatch]);

  console.log('isAuthenticated:', isAuthenticated);

  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FAF7F0' },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="GoalsSetup" component={GoalsSetupScreen} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
          <Stack.Screen name="ReviewDetail" component={ReviewDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="GoalsSetup" component={GoalsSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Legacy fonts (for fallback)
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          // Outfit fonts
          'Outfit-Thin': require('./assets/fonts/Outfit-Thin.ttf'),
          'Outfit-ExtraLight': require('./assets/fonts/Outfit-ExtraLight.ttf'),
          'Outfit-Light': require('./assets/fonts/Outfit-Light.ttf'),
          'Outfit-Regular': require('./assets/fonts/Outfit-Regular.ttf'),
          'Outfit-Medium': require('./assets/fonts/Outfit-Medium.ttf'),
          'Outfit-SemiBold': require('./assets/fonts/Outfit-SemiBold.ttf'),
          'Outfit-Bold': require('./assets/fonts/Outfit-Bold.ttf'),
          'Outfit-ExtraBold': require('./assets/fonts/Outfit-ExtraBold.ttf'),
          'Outfit-Black': require('./assets/fonts/Outfit-Black.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Font loading error:', error);
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F0FDF9]">
        <ActivityIndicator size="large" color="#36D592" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  console.log('App rendering...');
  
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}