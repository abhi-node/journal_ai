import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { notesAPI } from '../services/api';
import { formatUTCToLocalTime, formatUTCToLocalDate } from '../utils/timezone';

type RouteParams = {
  NoteDetail: {
    noteId?: string;
    noteData?: any;
  };
};

interface NoteEntry {
  timestamp: string;
  content: string;
}

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
    // Parse the date components to avoid timezone issues
    // Date string is in format YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in JS)
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parse note entries from JSON structure
  const getNoteEntries = (): NoteEntry[] => {
    if (!note || !note.content) return [];
    
    // Handle both old string format and new JSON format
    if (typeof note.content === 'string') {
      // Old format - single string
      return [{ timestamp: note.created_at, content: note.content }];
    } else if (note.content.entries && Array.isArray(note.content.entries)) {
      // New JSON format with entries array
      return note.content.entries;
    }
    
    return [];
  };

  const TimelineEntry = ({ entry, isLast }: { entry: NoteEntry; isLast: boolean }) => (
    <View className="flex-row">
      {/* Timeline */}
      <View className="items-center mr-3">
        <View className="w-3 h-3 bg-primary rounded-full" />
        {!isLast && <View className="w-0.5 bg-neutral-light flex-1 mt-1" />}
      </View>
      
      {/* Content */}
      <View className="flex-1 pb-6">
        {/* Time */}
        <Text 
          className="text-primary mb-2"
          style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
        >
          {formatUTCToLocalTime(entry.timestamp)}
        </Text>
        
        {/* Text */}
        <View className="bg-white/40 rounded-xl p-4">
          <Text 
            className="text-neutral-deep leading-6"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}
          >
            {entry.content}
          </Text>
        </View>
      </View>
    </View>
  );

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
              Daily Note
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
              {/* Date Card */}
              <View className="bg-white/60 backdrop-blur rounded-2xl p-4 mb-4 border border-neutral-light">
                <View className="flex-row items-center">
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
                  <Text 
                    className="text-lg text-neutral-dark"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    {formatDate(note.date)}
                  </Text>
                </View>
              </View>

              {/* Timeline Entries */}
              <View className="mb-4">
                <View className="flex-row items-center mb-4">
                  <Svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                    <Circle cx="12" cy="12" r="10" stroke="#B483F0" strokeWidth="2" fill="none" />
                    <Path
                      d="M12 6v6l4 2"
                      stroke="#B483F0"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text 
                    className="text-base text-neutral-dark"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    Timeline
                  </Text>
                </View>

                <View className="bg-white/30 rounded-2xl p-4 border border-neutral-light">
                  {getNoteEntries().length > 0 ? (
                    getNoteEntries().map((entry, index) => (
                      <TimelineEntry 
                        key={index} 
                        entry={entry} 
                        isLast={index === getNoteEntries().length - 1}
                      />
                    ))
                  ) : (
                    <Text 
                      className="text-neutral-mid text-center py-4"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      No entries recorded yet
                    </Text>
                  )}
                </View>
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