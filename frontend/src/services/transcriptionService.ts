import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getUserTimezone } from '../utils/timezone';

export interface TranscriptionResponse {
  success: boolean;
  message: string;
  task_id: string;
  status: string;
}

/**
 * Upload an audio file for transcription
 * @param audioUri - The URI of the recorded audio file
 * @returns The transcription result
 */
export async function transcribeAudio(audioUri: string): Promise<TranscriptionResponse> {
  try {
    // Get authentication token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create form data with the audio file
    const formData = new FormData();
    
    // For React Native, we need to create a proper file object
    // The file URI format differs between platforms
    const filename = audioUri.split('/').pop() || 'audio.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : 'audio/m4a';
    
    // Ensure the URI is properly formatted for the platform
    // On iOS, file:// URIs need to be handled correctly
    const fileUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
    
    // Check file exists and get its info
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist at URI: ' + fileUri);
      }
      
      if ('size' in fileInfo && (fileInfo.size === 0 || fileInfo.size < 100)) {
        // Audio file is too small, may result in poor transcription
      }
    } catch (err) {
      // Unable to get file info, continue anyway
    }
    
    
    // Add the audio file to form data
    // @ts-ignore - React Native FormData accepts this format
    formData.append('audio', {
      uri: fileUri,
      type: type,
      name: filename,
    });
    
    // Add user's timezone to the request
    const userTimezone = getUserTimezone();
    formData.append('user_timezone', userTimezone);

    // Make the API request
    const response = await fetch(`${API_CONFIG.API_BASE}/transcription/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

/**
 * Check the health of the transcription service
 * @returns True if the service is healthy
 */
export async function checkTranscriptionHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.API_BASE}/transcription/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    return false;
  }
}