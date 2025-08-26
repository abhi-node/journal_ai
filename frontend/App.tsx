import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import './global.css';

export default function App() {
  return (
    <Provider store={store}>
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg font-bold text-primary-600">JournalAI</Text>
        <Text className="text-gray-600 mt-2">Voice-Powered Accountability</Text>
        <StatusBar style="auto" />
      </View>
    </Provider>
  );
}
