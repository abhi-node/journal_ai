export interface RankInfo {
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

export const RANKS: RankInfo[] = [
  {
    name: "Novice",
    min_level: 1,
    max_level: 24,
    color: "#B8B5B2",
    gradient_start: "#B8B5B2",
    gradient_end: "#D0CDCA",
    description: "Just beginning your journey. Every master was once a novice.",
    icon_placeholder: "novice_icon"
  },
  {
    name: "Apprentice",
    min_level: 25,
    max_level: 49,
    color: "#A8C4B0",
    gradient_start: "#A8C4B0",
    gradient_end: "#C2D6C6",
    description: "Foundations are forming. Your habits are taking root.",
    icon_placeholder: "apprentice_icon"
  },
  {
    name: "Practitioner",
    min_level: 50,
    max_level: 99,
    color: "#A3BFD9",
    gradient_start: "#A3BFD9",
    gradient_end: "#C0D4E3",
    description: "Consistency becomes character. Your practice defines you.",
    icon_placeholder: "practitioner_icon"
  },
  {
    name: "Adept",
    min_level: 100,
    max_level: 174,
    color: "#C5B9E8",
    gradient_start: "#C5B9E8",
    gradient_end: "#DDD5F3",
    description: "Skill meets dedication. You've entered the top half.",
    icon_placeholder: "adept_icon"
  },
  {
    name: "Expert",
    min_level: 175,
    max_level: 274,
    color: "#E5C5FF",
    gradient_start: "#E5C5FF",
    gradient_end: "#F0DCFF",
    description: "Excellence is your baseline. Others look to you for guidance.",
    icon_placeholder: "expert_icon"
  },
  {
    name: "Master",
    min_level: 275,
    max_level: 399,
    color: "#FFB5C5",
    gradient_start: "#FFB5C5",
    gradient_end: "#FFD0DA",
    description: "True mastery emerges. You've joined the elite 15%.",
    icon_placeholder: "master_icon"
  },
  {
    name: "Grandmaster",
    min_level: 400,
    max_level: 499,
    color: "#FFCAA0",
    gradient_start: "#FFCAA0",
    gradient_end: "#FFE0C7",
    description: "Among the greatest. Top 5% of all journalers.",
    icon_placeholder: "grandmaster_icon"
  },
  {
    name: "Sage",
    min_level: 500,
    max_level: 649,
    color: "#FFF0A5",
    gradient_start: "#FFF0A5",
    gradient_end: "#FFF8D0",
    description: "Wisdom incarnate. You inspire transformation in others.",
    icon_placeholder: "sage_icon"
  },
  {
    name: "Enlightened",
    min_level: 650,
    max_level: 799,
    color: "#B5FFE1",
    gradient_start: "#B5FFE1",
    gradient_end: "#D0FFF0",
    description: "Transcendent understanding. A beacon for the community.",
    icon_placeholder: "enlightened_icon"
  },
  {
    name: "Ascended",
    min_level: 800,
    max_level: 899,
    color: "#B5E7FF",
    gradient_start: "#B5E7FF",
    gradient_end: "#D0F0FF",
    description: "Beyond mortal achievement. Legendary status achieved.",
    icon_placeholder: "ascended_icon"
  },
  {
    name: "Eternal",
    min_level: 900,
    max_level: 999,
    color: "#FFD0F0",
    gradient_start: "#FFD0F0",
    gradient_end: "#D0F0FF",
    description: "Immortalized in the pantheon. The ultimate achievement.",
    icon_placeholder: "eternal_icon",
    special_effect: "rainbow"
  }
];

export const getRankInfo = (level: number): RankInfo | null => {
  return RANKS.find(rank => level >= rank.min_level && level <= rank.max_level) || null;
};

export const getRankIcon = (iconPlaceholder: string): string => {
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
  return iconMap[iconPlaceholder] || '❓';
};