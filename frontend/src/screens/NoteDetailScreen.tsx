import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { notesAPI } from '../services/api';

type RouteParams = {
  NoteDetail: {
    noteId?: string;
    noteData?: any;
  };
};

const NoteDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'NoteDetail'>>();
  const [note, setNote] = useState<any>(route.params?.noteData || null);
  const [loading, setLoading] = useState(!route.params?.noteData);

  useEffect(() => {
    if (route.params?.noteId && !route.params?.noteData) {
      fetchNote();
    }
  }, [route.params?.noteId]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const data = await notesAPI.getNoteById(route.params?.noteId || '');
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LinearGradient
      colors={['#F0FDF9', '#FAF8FE', '#FFE8DB']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-4 flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mr-4 p-2"
              activeOpacity={0.7}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#4B5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text 
              className="text-2xl text-neutral-dark flex-1"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Note
            </Text>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#36D592" />
            </View>
          ) : note ? (
            <ScrollView 
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {/* Date and Time Card */}
              <View className="bg-white/60 backdrop-blur rounded-2xl p-4 mb-4 border border-neutral-light">
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
                    <Svg width="20" height="20" viewBox="0 0 24 24">
                      <Path
                        d="M8 7V3M16 7V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                        stroke="#36D592"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <View>
                    <Text 
                      className="text-base text-neutral-dark"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      {formatDate(note.date)}
                    </Text>
                    <Text 
                      className="text-sm text-neutral-mid"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      Recorded at {formatTime(note.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Content Card */}
              <View className="bg-white/60 backdrop-blur rounded-2xl p-5 mb-6 border border-neutral-light">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                    <Svg width="18" height="18" viewBox="0 0 24 24">
                      <Path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                        stroke="#B483F0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <Path
                        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                        stroke="#B483F0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text 
                    className="text-lg text-neutral-dark"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    Content
                  </Text>
                </View>
                <Text 
                  className="text-base text-neutral-deep leading-6"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {note.content}
                </Text>
              </View>

              {/* Bottom padding for scroll */}
              <View className="h-8" />
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text 
                className="text-lg text-neutral-mid"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Note not found
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default NoteDetailScreen;