import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme, elevation } from '../theme';

const { width, height } = Dimensions.get('window');

interface RankInfo {
  name: string;
  min_level: number;
  max_level: number;
  color: string;
  gradient_start: string;
  gradient_end: string;
  description: string;
  icon_placeholder: string;
  special_effect?: string;
}

interface RankRoadmapModalProps {
  visible: boolean;
  onClose: () => void;
  currentLevel: number;
  currentXP: number;
  ranks: RankInfo[];
}

const RankRoadmapModal: React.FC<RankRoadmapModalProps> = ({
  visible,
  onClose,
  currentLevel,
  currentXP,
  ranks,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-scroll to current rank
      const currentRankIndex = ranks.findIndex(
        rank => currentLevel >= rank.min_level && currentLevel <= rank.max_level
      );
      if (currentRankIndex !== -1 && scrollViewRef.current) {
        setTimeout(() => {
          const scrollPosition = Math.max(0, currentRankIndex * 220 - 100);
          scrollViewRef.current?.scrollTo({
            y: scrollPosition,
            animated: true,
          });
        }, 500);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const renderRankCard = (rank: RankInfo, index: number) => {
    const isCurrentRank = currentLevel >= rank.min_level && currentLevel <= rank.max_level;
    const isUnlocked = currentLevel >= rank.min_level;
    const progress = isCurrentRank
      ? ((currentLevel - rank.min_level) / (rank.max_level - rank.min_level + 1)) * 100
      : isUnlocked
      ? 100
      : 0;

    const getRankIcon = () => {
      // Placeholder for rank icons - replace with actual images when available
      const iconMap: { [key: string]: string } = {
        novice_icon: '🌱',
        apprentice_icon: '📚',
        practitioner_icon: '⚡',
        adept_icon: '💫',
        expert_icon: '🔥',
        master_icon: '👑',
        grandmaster_icon: '🏆',
        sage_icon: '✨',
        enlightened_icon: '🌟',
        ascended_icon: '⭐',
        eternal_icon: '🌈',
      };
      return iconMap[rank.icon_placeholder] || '❓';
    };

    return (
      <Animated.View
        key={rank.name}
        style={[
          styles.rankCard,
          isCurrentRank && styles.currentRankCard,
          !isUnlocked && styles.lockedRankCard,
          {
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, isUnlocked ? 1 : 0.5],
            }),
          },
        ]}
      >
        {rank.special_effect === 'rainbow' ? (
          <LinearGradient
            colors={['#FFD0F0', '#FFE0D0', '#FFFFD0', '#D0FFD0', '#D0F0FF', '#E0D0FF', '#FFD0FF'] as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankGradient}
          >
            {renderRankContent(rank, isCurrentRank, isUnlocked, progress, getRankIcon())}
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[rank.gradient_start, rank.gradient_end] as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankGradient}
          >
            {renderRankContent(rank, isCurrentRank, isUnlocked, progress, getRankIcon())}
          </LinearGradient>
        )}
      </Animated.View>
    );
  };

  const renderRankContent = (
    rank: RankInfo,
    isCurrentRank: boolean,
    isUnlocked: boolean,
    progress: number,
    icon: string
  ) => (
    <>
      <View style={styles.rankHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.rankIcon}>{icon}</Text>
          {/* Space for actual icon image */}
          {/* <Image 
            source={require(`../assets/ranks/${rank.icon_placeholder}.png`)} 
            style={styles.rankIconImage}
            resizeMode="contain"
          /> */}
        </View>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, isCurrentRank && styles.currentRankName]}>
            {rank.name}
          </Text>
          <Text style={styles.levelRange}>
            Level {rank.min_level} - {rank.max_level}
          </Text>
        </View>
      </View>

      <Text style={styles.rankDescription}>{rank.description}</Text>

      {isCurrentRank && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% Complete
          </Text>
        </View>
      )}

      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>🔒 Locked</Text>
          <Text style={styles.lockedLevelText}>
            Reach Level {rank.min_level} to unlock
          </Text>
        </View>
      )}
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rank Roadmap</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.currentLevelInfo}>
              <Text style={styles.currentLevelText}>
                Level {currentLevel} • {currentXP.toLocaleString()} XP
              </Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.ranksList}
              contentContainerStyle={styles.ranksListContent}
              showsVerticalScrollIndicator={false}
            >
              {ranks.map((rank, index) => renderRankCard(rank, index))}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 28,
    width: width * 0.95,
    maxWidth: 600,
    height: height * 0.9,
    maxHeight: height * 0.9,
    ...elevation(5),
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation(2),
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  currentLevelInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currentLevelText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  ranksList: {
    flex: 1,
  },
  ranksListContent: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  rankCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    ...elevation(3),
  },
  currentRankCard: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    ...elevation(4),
  },
  lockedRankCard: {
    opacity: 0.6,
  },
  rankGradient: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxl,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankIcon: {
    fontSize: 32,
  },
  rankIconImage: {
    width: 48,
    height: 48,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: 'white',
    marginBottom: 4,
  },
  currentRankName: {
    fontSize: theme.typography.fontSize.xxl,
  },
  levelRange: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rankDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  lockedText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  lockedLevelText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default RankRoadmapModal;