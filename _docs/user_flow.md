# User Flow - JournalAI

## Primary User Flow

### First-Time User
```
1. Download & Open App
   ↓
2. Create Account
   ↓
3. Goal Setup Wizard
   - Current goals
   - 1-year vision
   - 10-year vision
   - Priority areas (health, career, relationships, etc.)
   ↓
4. Set Review Time (default: 9 PM)
   ↓
5. Grant Permissions
   - Microphone access
   - Notifications
   ↓
6. Tutorial
   - How to record voice notes
   - Understanding daily reviews
   - Viewing progress
   ↓
7. Ready to Use
```

### Daily Flow

#### Recording a Voice Note
```
1. Open App → Home Screen
   ↓
2. Tap Microphone Button (prominent center button)
   ↓
3. Start Speaking (natural language)
   ↓
4. Tap Stop or Pause Speaking
   ↓
5. Note Automatically Saved
   ↓
6. Return to Home Screen
```

#### Receiving Daily Review
```
1. 9 PM Notification: "Your daily review is ready"
   ↓
2. Tap Notification → Opens Review Screen
   ↓
3. View Review Contents:
   - Daily score (0-100)
   - Key activities summary
   - Goal progress
   - Tomorrow's recommendations
   ↓
4. Optional: Add reflection note
   ↓
5. Close or Navigate to Stats
```

### Weekly Flow
```
Sunday 9 PM
   ↓
1. Weekly Review Notification
   ↓
2. Open Weekly Summary:
   - Week's average score
   - Daily score trend graph
   - Top achievements
   - Areas for improvement
   - Next week's focus areas
   ↓
3. Review Stats & Level Progress
```

## Screen Flow

### Main Screens

1. **Home Screen**
   - Large microphone button (center)
   - Today's notes count
   - Quick stats preview
   - Navigation menu

2. **Recording Screen**
   - Active recording indicator
   - Waveform visualization
   - Stop button
   - Cancel option

3. **Daily Review Screen**
   - Score display (large, prominent)
   - Summary cards
   - Progress indicators
   - Task recommendations

4. **Stats/Profile Screen**
   - Level and XP display
   - Skill category progress bars
   - Achievement badges
   - Historical trends

5. **Goals Screen**
   - Current goals list
   - Edit goals option
   - Goal completion tracking

## Key Interactions

### Voice Recording
- **Single Tap**: Start recording
- **Single Tap Again**: Stop recording
- **Hold**: Continuous recording (release to stop)
- **Swipe Up**: Cancel recording

### Navigation
- **Tab Bar**: Home | Reviews | Stats | Goals
- **Swipe Gestures**: Navigate between daily reviews
- **Pull to Refresh**: Update stats and sync

## Error States

### No Internet
- Voice notes saved locally
- Sync when connection restored
- Show offline indicator

### Recording Failed
- Clear error message
- Retry option
- Alternative text input

### Review Generation Failed
- Show partial review if available
- Manual refresh option
- Contact support link

## Accessibility
- Voice-over support for all elements
- High contrast mode
- Adjustable text size
- Alternative text input for voice notes