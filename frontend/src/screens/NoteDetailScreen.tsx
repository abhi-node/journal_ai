import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { notesAPI } from '../services/api';
import { formatUTCToLocalTime, formatUTCToLocalDate, formatRelativeDate } from '../utils/timezone';
import { theme } from '../theme';
import { AnimatedCard } from '../components/ui';

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
  
  const getNoteTitle = () => {
    if (!note || !note.date) return 'Daily Note';
    return formatRelativeDate(note.date);
  };

  const TimelineEntry = ({ entry, isLast }: { entry: NoteEntry; isLast: boolean }) => (
    <View style={styles.timelineRow}>
      {/* Timeline */}
      <View style={styles.timelineIndicator}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      
      {/* Content */}
      <View style={styles.timelineContent}>
        {/* Time */}
        <Text style={styles.timelineTime}>
          {formatUTCToLocalTime(entry.timestamp)}
        </Text>
        
        {/* Text */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineText}>
            {entry.content}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.colors.gradients.soft as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke={theme.colors.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {getNoteTitle()}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : note ? (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Card */}
              <AnimatedCard variant="elevated" style={styles.dateCard}>
                <View style={styles.dateCardContent}>
                  <View style={styles.dateIconContainer}>
                    <Svg width="20" height="20" viewBox="0 0 24 24">
                      <Path
                        d="M8 7V3M16 7V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                        stroke={theme.colors.text.primary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(note.date)}
                  </Text>
                </View>
              </AnimatedCard>

              {/* Notes Content */}
              <AnimatedCard variant="elevated" style={styles.notesCard}>
                <View style={styles.notesHeader}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.notesIcon}>
                    <Circle cx="12" cy="12" r="10" stroke={theme.colors.primary} strokeWidth="2" fill="none" />
                    <Path
                      d="M12 6v6l4 2"
                      stroke={theme.colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={styles.notesTitle}>
                    Notes
                  </Text>
                </View>

                <View style={styles.notesContent}>
                  {getNoteEntries().length > 0 ? (
                    getNoteEntries().map((entry, index) => (
                      <TimelineEntry 
                        key={index} 
                        entry={entry} 
                        isLast={index === getNoteEntries().length - 1}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No content available
                    </Text>
                  )}
                </View>
              </AnimatedCard>

              {/* Bottom padding for scroll */}
              <View style={styles.bottomPadding} />
            </ScrollView>
          ) : (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundText}>
                Note not found
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  dateCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  dateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  notesCard: {
    padding: theme.spacing.lg,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  notesIcon: {
    marginRight: theme.spacing.sm,
  },
  notesTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  notesContent: {
    paddingLeft: theme.spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    backgroundColor: theme.colors.accent,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: theme.spacing.lg,
  },
  timelineTime: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  timelineText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  bottomPadding: {
    height: theme.spacing.lg,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notFoundText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
});

export default NoteDetailScreen;