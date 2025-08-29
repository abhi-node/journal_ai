import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { transcribeAudio } from '../services/transcriptionService';

interface UseAudioRecordingOptions {
  onTranscriptionComplete?: (text: string) => void;
  onNoteSaved?: (noteId: string, date: string) => void;
  onError?: (error: string) => void;
}

export const useAudioRecording = (options: UseAudioRecordingOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);
  
  // Initialize recorder with HIGH_QUALITY preset
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Setup permissions and audio mode on mount
  useEffect(() => {
    (async () => {
      try {
        // Request microphone permissions
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setPermissionStatus(status.granted);
        
        if (!status.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow microphone access to record audio.'
          );
          return;
        }

        // Set basic audio mode for recording
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        
      } catch (error) {
        console.error('Failed to setup audio:', error);
        setPermissionStatus(false);
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      // Clear previous transcription
      setTranscription('');
      
      // Check permissions
      if (!permissionStatus) {
        Alert.alert('Error', 'Microphone permission not granted');
        return;
      }

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      options.onError?.('Failed to start recording');
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsProcessing(true);
      
      // Stop the recording
      await audioRecorder.stop();
      
      const recordingUri = audioRecorder.uri;
      
      if (!recordingUri) {
        throw new Error('No recording URI found');
      }
      
      // Upload and queue transcription
      const result = await transcribeAudio(recordingUri);
      
      if (result.success && result.task_id) {
        // Task was queued successfully
        setTranscription('Processing...'); // Just for internal state
        options.onTranscriptionComplete?.(''); // Notify completion without transcription text
        options.onNoteSaved?.(result.task_id, new Date().toISOString());
      } else {
        throw new Error('Failed to queue transcription');
      }
      
    } catch (error) {
      console.error('Failed to stop/process recording:', error);
      options.onError?.('Failed to process recording');
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const cancelRecording = async () => {
    if (recorderState.isRecording) {
      try {
        await audioRecorder.stop();
        setTranscription('');
      } catch (error) {
        console.error('Error cancelling recording:', error);
      }
    }
  };

  return {
    isRecording: recorderState.isRecording,
    isProcessing,
    transcription,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
    recordingDuration: Math.floor((recorderState.durationMillis || 0) / 1000),
    permissionStatus,
  };
};