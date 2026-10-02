export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface VideoSourceOption {
  id: string;
  name: string;
  description: string;
  url: string;
  storageBucket?: string;
  storagePath?: string;
  isCustom?: boolean;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucketName: string;
  filePath: string;
  fetchMode: 'public_url' | 'signed_url' | 'database_table';
  tableName?: string;
}

export interface OverlaySettings {
  width: number;
  height: number;
  opacity: number;
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  showFaceGuide: boolean;
  mirrorCamera: boolean;
  blendMode: 'normal' | 'screen' | 'lighten' | 'overlay';
}
