import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2,
  Download,
  ShieldCheck,
  VideoOff,
  Maximize2
} from 'lucide-react';
import { OverlaySettings, SupabaseConfig, VideoSourceOption } from '../types';
import { fetchVideoUrlFromSupabase } from '../services/supabaseService';

interface LiveFaceCameraViewProps {
  supabaseConfig: SupabaseConfig;
  selectedVideo: VideoSourceOption;
  overlaySettings: OverlaySettings;
  openSettings: () => void;
  isMobileFrame: boolean;
}

export const LiveFaceCameraView: React.FC<LiveFaceCameraViewProps> = ({
  supabaseConfig,
  selectedVideo,
  overlaySettings,
  openSettings,
  isMobileFrame
}) => {
  // Referências para os elementos de vídeo e canvas
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de Inicialização Dupla
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Estado de controle da Câmera
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>(selectedVideo.url);
  const [videoSourceType, setVideoSourceType] = useState<string>('sample');
  const [isVirtualFeedActive, setIsVirtualFeedActive] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Limpeza de recursos para evitar memory leaks (Component Cleanup)
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  // [REQUISITO 1] Inicialização da Câmera ao Vivo (Frontal por padrão)
  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    setIsCameraLoading(true);
    setCameraPermissionError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('A API MediaDevices de câmera não está disponível neste navegador.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Desativa microfone conforme melhores práticas para economia de recursos
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.setAttribute('playsinline', 'true');
        cameraVideoRef.current.muted = true;
        await cameraVideoRef.current.play();
      }

      setIsCameraLoading(false);
      setIsVirtualFeedActive(false);
    } catch (err: unknown) {
      console.warn('Erro ao acessar câmera real:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      // Fallback amigável para quando o usuário nega a permissão
      setCameraPermissionError(
        errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')
          ? 'O acesso à câmera foi negado nas configurações do navegador.'
          : `Não foi possível acessar a câmera: ${errorMsg}`
      );
      setIsCameraLoading(false);
    }
  }, [stopCameraStream]);

  // Modo Simulador de Câmera (quando a câmera real não está disponível ou foi negada no sandbox)
  const enableVirtualCamera = useCallback(() => {
    stopCameraStream();
    setCameraPermissionError(null);
    setIsCameraLoading(true);

    setTimeout(() => {
      setIsVirtualFeedActive(true);
      setIsCameraLoading(false);
    }, 400);
  }, [stopCameraStream]);

  // [REQUISITO 1 & 4] Busca e Inicialização do Vídeo no Supabase
  const loadSupabaseVideo = useCallback(async () => {
    setIsVideoLoading(true);
    setVideoError(null);

    try {
      const result = await fetchVideoUrlFromSupabase(supabaseConfig, selectedVideo.url);
      setResolvedVideoUrl(result.url);
      setVideoSourceType(result.source);

      if (result.error) {
        console.info(result.error);
      }
    } catch (err) {
      console.error('Erro ao buscar vídeo do Supabase:', err);
      setVideoError('Erro ao buscar vídeo no Supabase Storage. Usando mídia local de fallback.');
      setResolvedVideoUrl(selectedVideo.url);
    }
  }, [supabaseConfig, selectedVideo]);

  // [REQUISITO 1] Dupla Inicialização Simultânea
  useEffect(() => {
    let isMounted = true;

    const initializeBoth = async () => {
      // Dispara a câmera e o vídeo simultaneamente
      await Promise.allSettled([
        startCamera(facingMode),
        loadSupabaseVideo()
      ]);
    };

    initializeBoth();

    return () => {
      isMounted = false;
      stopCameraStream();
      if (overlayVideoRef.current) {
        overlayVideoRef.current.pause();
        overlayVideoRef.current.src = '';
      }
    };
  }, [facingMode, selectedVideo, loadSupabaseVideo, startCamera, stopCameraStream]);

  // Manipulador quando o vídeo oval termina de carregar metadados
  const handleOverlayVideoLoaded = () => {
    setIsVideoLoading(false);
    if (overlayVideoRef.current) {
      // Garante configurações estritas: muted, autoplay, loop, playsinline
      overlayVideoRef.current.muted = true;
      overlayVideoRef.current.play().catch(e => console.warn('Autoplay prevented:', e));
    }
  };

  // Alterna câmera Frontal / Traseira
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Captura de Foto/Snapshot da Câmera + Sobreposição Oval
  const handleTakeSnapshot = () => {
    setIsCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // 1. Desenha o fundo da câmera
    if (cameraVideoRef.current && !isVirtualFeedActive && !cameraPermissionError) {
      ctx.save();
      if (overlaySettings.mirrorCamera && facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Fundo gradiente simulado
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Silhueta do usuário simulado
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 40, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Desenha o vídeo oval sobreposto recortado
    if (overlayVideoRef.current) {
      const ovalW = (overlaySettings.width / 100) * (canvas.width * 0.7);
      const ovalH = (overlaySettings.height / 100) * (canvas.height * 0.45);
      const ovalX = canvas.width / 2;
      const ovalY = canvas.height / 2;

      ctx.save();
      ctx.globalAlpha = overlaySettings.opacity;
      ctx.beginPath();
      ctx.ellipse(ovalX, ovalY, ovalW / 2, ovalH / 2, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(
        overlayVideoRef.current,
        ovalX - ovalW / 2,
        ovalY - ovalH / 2,
        ovalW,
        ovalH
      );
      ctx.restore();

      // Borda do oval
      if (overlaySettings.showBorder) {
        ctx.strokeStyle = overlaySettings.borderColor;
        ctx.lineWidth = overlaySettings.borderWidth * 2;
        ctx.beginPath();
        ctx.ellipse(ovalX, ovalY, ovalW / 2, ovalH / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSnapshotUrl(dataUrl);
    setIsCapturing(false);
  };

  const isFullyLoaded = !isCameraLoading && !isVideoLoading;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-950 overflow-hidden relative">
      {/* Contêiner principal (Simulação em Moldura Mobile ou Full Viewport) */}
      <div
        className={`relative transition-all duration-300 overflow-hidden bg-black shadow-2xl flex flex-col items-center justify-center ${
          isMobileFrame
            ? 'w-[360px] sm:w-[390px] h-[680px] sm:h-[720px] rounded-[42px] border-[10px] border-slate-800 ring-1 ring-slate-700/60'
            : 'w-full max-w-4xl h-[650px] md:h-[720px] rounded-2xl border border-slate-800'
        }`}
      >
        {/* Notch / Dynamic Island no modo mobile */}
        {isMobileFrame && (
          <div className="absolute top-2.5 z-40 w-28 h-4 bg-slate-900 rounded-full flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* [REQUISITO 2 - CAMADA INFERIOR (FUNDO)] Câmera ao Vivo */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 z-0 flex items-center justify-center">
          {cameraPermissionError ? (
            /* [EDGE CASE: Permissão Negada - Fallback Elegante] */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-20">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <VideoOff className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Acesso à Câmera Negado</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                {cameraPermissionError}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tentar Novamente
                </button>
                <button
                  onClick={enableVirtualCamera}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Simular Câmera Virtual
                </button>
              </div>
            </div>
          ) : isVirtualFeedActive ? (
            /* Feed Virtual Simulado */
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 select-none">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
              {/* Silhueta simulando usuário na frente da câmera */}
              <div className="relative flex flex-col items-center opacity-70">
                <div className="w-32 h-40 rounded-[50%] bg-slate-800/80 border-2 border-slate-700/50 flex items-center justify-center">
                  <div className="w-16 h-20 rounded-[50%] border border-dashed border-slate-600/50"></div>
                </div>
                <div className="w-52 h-28 -mt-6 rounded-t-full bg-slate-800/60 border-t border-slate-700/50"></div>
                <span className="text-[11px] font-mono text-emerald-400/90 mt-4 tracking-wider uppercase">
                  Feed de Câmera Simulado (Teste Ativo)
                </span>
              </div>
            </div>
          ) : (
            /* Feed Real da Câmera WebRTC */
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-200 ${
                overlaySettings.mirrorCamera && facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* [REQUISITO 2 - CAMADA SUPERIOR (FRENTE)] Player Oval de Vídeo */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="relative flex items-center justify-center transition-all duration-300"
            style={{
              width: `${overlaySettings.width}px`,
              height: `${overlaySettings.height}px`,
              opacity: overlaySettings.opacity,
            }}
          >
            {/* Contêiner de Recorte Perfeitamente Oval (ClipOval / Clip-path) */}
            <div
              className="relative w-full h-full overflow-hidden shadow-2xl transition-all duration-200"
              style={{
                borderRadius: '50% / 50%',
                clipPath: 'ellipse(50% 50% at 50% 50%)',
                mixBlendMode: overlaySettings.blendMode,
              }}
            >
              {/* [REQUISITO 3] Configuração Crítica do Vídeo:
                  - autoPlay
                  - loop
                  - muted (obrigatório para autoplay sem bloqueios em mobile)
                  - playsInline (essencial no Safari/iOS)
                  - controls={false} (sem controles visíveis)
                  - object-cover (mantém aspect ratio sem esticar)
              */}
              <video
                ref={overlayVideoRef}
                key={resolvedVideoUrl}
                src={resolvedVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                onLoadedData={handleOverlayVideoLoaded}
                onError={() => {
                  setVideoError('Erro ao carregar vídeo do Supabase Storage. Usando fallback.');
                  setIsVideoLoading(false);
                }}
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Spinner de carregamento apenas para o vídeo oval se estiver buscando */}
              {isVideoLoading && (
                <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
                  <span className="text-[10px] text-slate-300 font-medium">Buscando Vídeo...</span>
                </div>
              )}
            </div>

            {/* Borda Iluminada de Alinhamento Oval */}
            {overlaySettings.showBorder && (
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-200"
                style={{
                  borderRadius: '50% / 50%',
                  border: `${overlaySettings.borderWidth}px solid ${overlaySettings.borderColor}`,
                  boxShadow: `0 0 24px ${overlaySettings.borderColor}66, inset 0 0 16px ${overlaySettings.borderColor}33`,
                }}
              />
            )}

            {/* Guia Biométrico Facial (Marcações de olhos, nariz e queixo) */}
            {overlaySettings.showFaceGuide && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Linha de Alinhamento dos Olhos */}
                <div className="w-2/3 h-px bg-cyan-400/40 border-b border-dashed border-cyan-400/60 mb-8 flex justify-between px-4">
                  <div className="w-1.5 h-1.5 -mt-0.5 rounded-full bg-cyan-400"></div>
                  <div className="w-1.5 h-1.5 -mt-0.5 rounded-full bg-cyan-400"></div>
                </div>
                {/* Linha Central de Nariz/Rosto */}
                <div className="w-px h-16 bg-cyan-400/40 border-r border-dashed border-cyan-400/60"></div>
                {/* Marcador do Queixo */}
                <div className="w-12 h-px bg-cyan-400/60 mt-10"></div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Loading Spinner Geral (Inicialização Dupla) */}
        {/* ------------------------------------------------------------- */}
        {(!isFullyLoaded && !cameraPermissionError) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              <Camera className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Inicialização Dupla em Andamento
            </h4>
            <div className="flex flex-col gap-1 text-xs text-slate-400 max-w-xs">
              <span className="flex items-center justify-center gap-1.5">
                {isCameraLoading ? (
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                Acessando sensor de câmera frontal...
              </span>
              <span className="flex items-center justify-center gap-1.5">
                {isVideoLoading ? (
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                Buscando vídeo pré-gravado no Supabase Storage...
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* HUD Superior (Status, Origem Supabase, Alternar Câmera) */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute top-0 inset-x-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isFullyLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-white font-medium text-[11px] tracking-wide">
              {isFullyLoaded ? 'AO VIVO' : 'SINCRONIZANDO'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-[10px] text-slate-300 font-mono">
              {supabaseConfig.supabaseUrl.includes('xzytsgjlsyjwgcalbqid') ? 'xzytsgjlsyjwgcalbqid' : (videoSourceType === 'supabase_storage' ? 'Supabase Storage' : 'Supabase (Demo)')}
            </span>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleCamera}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors"
              title="Alternar Câmera (Frontal / Traseira)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            <button
              onClick={openSettings}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors"
              title="Configurações e Parâmetros"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* HUD Inferior (Captura, Ajustes Rápidos e Instruções) */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-20 flex flex-col items-center gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Instrução ao Usuário */}
          <p className="text-xs text-white/90 font-medium text-center drop-shadow-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Alinhe seu rosto dentro da demarcação oval com o vídeo guia
          </p>

          {/* Barra de Ações Rápidas */}
          <div className="flex items-center gap-4">
            <button
              onClick={enableVirtualCamera}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white bg-black/50 rounded border border-white/10 transition-colors"
            >
              Alternar Câmera Virtual
            </button>

            {/* Botão de Disparo / Snapshot */}
            <button
              onClick={handleTakeSnapshot}
              disabled={isCapturing}
              className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md p-1 border-2 border-white transition-all transform active:scale-95 flex items-center justify-center shadow-lg"
              title="Capturar Foto com Sobreposição Oval"
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
            </button>

            <button
              onClick={() => {
                startCamera(facingMode);
                loadSupabaseVideo();
              }}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white bg-black/50 rounded border border-white/10 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Recarregar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Snapshot Capturado */}
      {snapshotUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full flex flex-col items-center shadow-2xl">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-sm font-semibold text-white">Captura Realizada</span>
              <button
                onClick={() => setSnapshotUrl(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fechar
              </button>
            </div>
            <img
              src={snapshotUrl}
              alt="Snapshot Capturado"
              className="w-full h-80 object-cover rounded-xl border border-slate-700 mb-4"
            />
            <div className="flex gap-2 w-full">
              <a
                href={snapshotUrl}
                download="captura_facial_supabase.jpg"
                className="flex-1 py-2 text-xs font-semibold text-center text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Imagem
              </a>
              <button
                onClick={() => setSnapshotUrl(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
