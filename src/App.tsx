import React, { useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { LiveFaceCameraView } from './components/LiveFaceCameraView';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { SettingsModal } from './components/SettingsModal';
import { VercelDeployGuideModal } from './components/VercelDeployGuideModal';
import { OverlaySettings, SupabaseConfig, VideoSourceOption } from './types';
import { SAMPLE_VIDEOS } from './data/sampleVideos';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live_view' | 'flutter_code' | 'architecture'>('live_view');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVercelGuideOpen, setIsVercelGuideOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Estado de Configuração do Supabase com o projeto do usuário
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    supabaseUrl: 'https://xzytsgjlsyjwgcalbqid.supabase.co',
    supabaseAnonKey: '',
    bucketName: 'biometric-templates',
    filePath: 'guides/face_guide_v1.mp4',
    fetchMode: 'public_url',
    tableName: 'video_configs'
  });

  // Estado de Customização do Oval e da Câmera
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    width: 250,
    height: 340,
    opacity: 0.88,
    showBorder: true,
    borderColor: '#00E5FF',
    borderWidth: 3,
    showFaceGuide: true,
    mirrorCamera: true,
    blendMode: 'normal'
  });

  // Vídeo Selecionado (Presets ou Custom)
  const [selectedVideo, setSelectedVideo] = useState<VideoSourceOption>(SAMPLE_VIDEOS[0]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 3-Zone Top Navigation Contract */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        openVercelGuide={() => setIsVercelGuideOpen(true)}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full relative">
        {activeTab === 'live_view' && (
          <LiveFaceCameraView
            supabaseConfig={supabaseConfig}
            selectedVideo={selectedVideo}
            overlaySettings={overlaySettings}
            openSettings={() => setIsSettingsOpen(true)}
            isMobileFrame={isMobileFrame}
          />
        )}

        {activeTab === 'flutter_code' && <FlutterCodeViewer />}

        {activeTab === 'architecture' && <ArchitectureDiagram />}
      </main>

      {/* Settings Modal (Supabase, Geometry & Presets) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        supabaseConfig={supabaseConfig}
        setSupabaseConfig={setSupabaseConfig}
        overlaySettings={overlaySettings}
        setOverlaySettings={setOverlaySettings}
        selectedVideo={selectedVideo}
        setSelectedVideo={setSelectedVideo}
      />

      {/* Vercel & GitHub Deployment Guide Modal */}
      <VercelDeployGuideModal
        isOpen={isVercelGuideOpen}
        onClose={() => setIsVercelGuideOpen(false)}
      />
    </div>
  );
}
