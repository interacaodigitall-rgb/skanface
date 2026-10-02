import React from 'react';
import { Camera, Code2, Sliders, Smartphone, Sparkles } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'live_view' | 'flutter_code' | 'architecture';
  setActiveTab: (tab: 'live_view' | 'flutter_code' | 'architecture') => void;
  openSettings: () => void;
  openVercelGuide: () => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  openVercelGuide,
  isMobileFrame,
  setIsMobileFrame,
}) => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between z-40 sticky top-0 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Camera className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
            Supabase Face Camera
            <span className="text-xs font-normal text-emerald-400 tracking-normal border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 rounded">
              Flutter Ready
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / Segmented Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('live_view')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'live_view'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Simulador ao Vivo</span>
          <span className="sm:hidden">Ao Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('flutter_code')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'flutter_code'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Código Flutter (Dart)</span>
          <span className="sm:hidden">Código</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'architecture'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Arquitetura & Requisitos</span>
          <span className="md:hidden">Arquitetura</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2">
        {activeTab === 'live_view' && (
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isMobileFrame
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
            title="Alternar Moldura Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMobileFrame ? 'Moldura Smartphone' : 'Tela Cheia'}</span>
          </button>
        )}

        <button
          onClick={openVercelGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-black hover:bg-slate-900 border border-slate-700/80 rounded-lg transition-colors"
          title="Guia de Deploy no Vercel"
        >
          <svg className="w-3 h-3 fill-current text-white" viewBox="0 0 24 24">
            <path d="M24 22.525H0l12-21.05 12 21.05z" />
          </svg>
          <span className="hidden sm:inline">Deploy Vercel</span>
        </button>

        <button
          onClick={openSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
          title="Configurações Supabase e Vídeo"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Ajustes & Supabase</span>
        </button>
      </div>
    </header>
  );
};
