import { VideoSourceOption } from '../types';

export const SAMPLE_VIDEOS: VideoSourceOption[] = [
  {
    id: 'biometric-face-scan',
    name: 'Guia Biométrico Facial (Holográfico)',
    description: 'Vídeo em loop com contorno facial tecnológico e guia de enquadramento 3D.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    storageBucket: 'biometric-templates',
    storagePath: 'guides/face_guide_v1.mp4'
  },
  {
    id: 'avatar-instruction',
    name: 'Assistente Virtual / Avatar (Instrução)',
    description: 'Loop de demonstração de expressão facial para validação de vivacidade.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    storageBucket: 'onboarding-assets',
    storagePath: 'videos/avatar_loop.mp4'
  },
  {
    id: 'liveness-motion',
    name: 'Movimento de Referência (Liveness)',
    description: 'Vídeo pré-gravado com rotação de cabeça suave para prova de vida.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    storageBucket: 'security-videos',
    storagePath: 'reference/liveness_sample.mp4'
  }
];
