import React, { useState } from 'react';
import { X, Database, Sliders, Eye, RefreshCw, KeyRound, Check, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { OverlaySettings, SupabaseConfig, VideoSourceOption } from '../types';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { sanitizeSupabaseUrl, testSupabaseConnection } from '../services/supabaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: React.Dispatch<React.SetStateAction<SupabaseConfig>>;
  overlaySettings: OverlaySettings;
  setOverlaySettings: React.Dispatch<React.SetStateAction<OverlaySettings>>;
  selectedVideo: VideoSourceOption;
  setSelectedVideo: (video: VideoSourceOption) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  supabaseConfig,
  setSupabaseConfig,
  overlaySettings,
  setOverlaySettings,
  selectedVideo,
  setSelectedVideo,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const cleanUrl = sanitizeSupabaseUrl(supabaseConfig.supabaseUrl);
  // Extrai o ID do projeto (subdomínio)
  const projectId = cleanUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] || null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const result = await testSupabaseConnection(supabaseConfig);
      setTestStatus(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus({ success: false, message: msg });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Configurações & Integração Supabase</h3>
              <p className="text-xs text-slate-400">Ajuste credenciais, buckets e dimensões do oval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Supabase Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-white text-sm">Parâmetros do Supabase Storage</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    Supabase Project URL
                  </label>
                  {projectId && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      ID: {projectId}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseConfig.supabaseUrl}
                  onChange={(e) => {
                    const clean = sanitizeSupabaseUrl(e.target.value);
                    setSupabaseConfig((prev) => ({ ...prev, supabaseUrl: clean }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  URL base normalizada para conexões de Storage, REST e Auth.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    Supabase Anon Key (Pública)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Dashboard &gt; Settings &gt; API
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseConfig.supabaseAnonKey}
                    onChange={(e) =>
                      setSupabaseConfig((prev) => ({ ...prev, supabaseAnonKey: e.target.value.trim() }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Necessária para assinar URLs e autenticar requisições de Storage.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nome do Bucket de Armazenamento
                </label>
                <input
                  type="text"
                  placeholder="biometric-templates"
                  value={supabaseConfig.bucketName}
                  onChange={(e) =>
                    setSupabaseConfig((prev) => ({ ...prev, bucketName: e.target.value.trim() }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Caminho do Arquivo (Storage Path)
                </label>
                <input
                  type="text"
                  placeholder="guides/face_guide_v1.mp4"
                  value={supabaseConfig.filePath}
                  onChange={(e) =>
                    setSupabaseConfig((prev) => ({ ...prev, filePath: e.target.value.trim() }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Test Connection Button & Result Feedback */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Verificação do Servidor:</span>
                <span className="font-mono text-slate-200">{cleanUrl || 'Nenhum'}</span>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !cleanUrl}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Verificando...' : 'Testar Conexão Supabase'}
              </button>
            </div>

            {testStatus && (
              <div
                className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                {testStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  <p className="font-medium">{testStatus.message}</p>
                </div>
              </div>
            )}

            {/* Fetch Mode Selection */}
            <div className="mt-3">
              <label className="block text-slate-300 font-medium mb-1.5">
                Modo de Resgate no Supabase
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'public_url', title: 'URL Pública', desc: 'Bucket público direto' },
                  { id: 'signed_url', title: 'URL Assinada', desc: 'Token seguro temporário' },
                  { id: 'database_table', title: 'Tabela do Banco', desc: 'Query SQL / Tabela' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setSupabaseConfig((prev) => ({
                        ...prev,
                        fetchMode: mode.id as SupabaseConfig['fetchMode'],
                      }))
                    }
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      supabaseConfig.fetchMode === mode.id
                        ? 'bg-slate-800 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-semibold block text-xs">{mode.title}</span>
                    <span className="text-[10px] text-slate-400">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Preset Videos (Demonstração Out-of-the-box) */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-2">Vídeos Pré-Configurados para Teste</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_VIDEOS.map((video) => (
                <button
                  key={video.id}
                  onClick={() => {
                    setSelectedVideo(video);
                    setSupabaseConfig((prev) => ({
                      ...prev,
                      bucketName: video.storageBucket || 'biometric-templates',
                      filePath: video.storagePath || 'guides/face_guide_v1.mp4',
                    }));
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedVideo.id === video.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-white">{video.name}</span>
                    {selectedVideo.id === video.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{video.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Overlay Oval Geometrics */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-3">Geometria e Estilo do Oval Facial</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Largura do Oval:</span>
                  <span className="font-mono text-emerald-400">{overlaySettings.width}px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="400"
                  step="5"
                  value={overlaySettings.width}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, width: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Altura do Oval:</span>
                  <span className="font-mono text-emerald-400">{overlaySettings.height}px</span>
                </div>
                <input
                  type="range"
                  min="220"
                  max="520"
                  step="5"
                  value={overlaySettings.height}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, height: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Opacidade do Vídeo:</span>
                  <span className="font-mono text-emerald-400">{Math.round(overlaySettings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={overlaySettings.opacity}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Espessura da Borda:</span>
                  <span className="font-mono text-emerald-400">{overlaySettings.borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={overlaySettings.borderWidth}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, borderWidth: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Color picker & Toggles */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-xs">Cor da Borda:</span>
                {['#00E5FF', '#3ECF8E', '#F59E0B', '#EC4899', '#FFFFFF'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setOverlaySettings((prev) => ({ ...prev, borderColor: color }))}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      overlaySettings.borderColor === color
                        ? 'scale-125 border-white ring-2 ring-emerald-500/50'
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={overlaySettings.showFaceGuide}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, showFaceGuide: e.target.checked }))
                  }
                  className="rounded accent-emerald-500"
                />
                <span className="text-slate-300 text-xs">Guia Biométrico (Olhos/Nariz)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={overlaySettings.mirrorCamera}
                  onChange={(e) =>
                    setOverlaySettings((prev) => ({ ...prev, mirrorCamera: e.target.checked }))
                  }
                  className="rounded accent-emerald-500"
                />
                <span className="text-slate-300 text-xs">Espelhar Câmera Frontal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Concluir Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};
