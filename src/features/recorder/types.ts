/**
 * Platform-agnostic audio recorder contract.
 * Web: WebAudioRecorder
 * Future Expo: ExpoAudioRecorder using expo-av
 */
export interface AudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  cancel(): Promise<void>;
  getElapsedMs(): number;
}
