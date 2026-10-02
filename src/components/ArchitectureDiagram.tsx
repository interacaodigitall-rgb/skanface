import React from 'react';
import { Layers, Database, Video, Camera, Cpu, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full flex-1 flex flex-col max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto space-y-8">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Arquitetura de Mídia em Camadas & Fluxo Supabase
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Visão esquemática da composição de renderização gráfica, controle de concorrência assíncrona e desacoplamento de infraestrutura entre o Supabase Storage e o hardware de captura do dispositivo.
        </p>
      </div>

      {/* 1. Z-Index Layer Stack */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          1. Modelo de Camadas Visuais (Flutter Stack / Web Z-Index)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Layer 1 */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
            <div className="w-2 h-full bg-emerald-500 absolute left-0 top-0"></div>
            <div className="pl-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                Z-Index: 0 · Fundo
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Câmera ao Vivo
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sensor frontal em tela cheia com cálculo matemático de proporção (<code className="text-emerald-300">BoxFit.cover</code>) para evitar qualquer achatamento em diferentes telas.
              </p>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
            <div className="w-2 h-full bg-cyan-500 absolute left-0 top-0"></div>
            <div className="pl-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                Z-Index: 1 · Frente
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Vídeo Oval Supabase
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recortado com <code className="text-cyan-300">ClipOval</code>. Configurado com <code className="text-cyan-300">looping: true</code>, <code className="text-cyan-300">volume: 0.0</code> (muted), autoplay imediato e sem controles de mídia.
              </p>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
            <div className="w-2 h-full bg-indigo-500 absolute left-0 top-0"></div>
            <div className="pl-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                Z-Index: 2 · Topo
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                HUD & Guias Biométricos
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controles de alternância de câmera frontal/traseira, indicador de status online/offline, mira biométrica e botão de disparo/fechamento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dual Initialization Flow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          2. Fluxograma de Inicialização Dupla Simultânea
        </h3>

        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex-1">
            <span className="text-xs text-slate-500 font-mono">PASSO 1</span>
            <h5 className="text-sm font-semibold text-white">initState() Dispara</h5>
            <p className="text-[11px] text-slate-400">
              Inicia a montagem da tela e ativa o spinner de sincronização.
            </p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          <div className="flex-1 bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-xs text-emerald-400 font-mono font-semibold">Future.wait([ ... ])</span>
            <div className="text-[11px] text-slate-300 mt-1 space-y-1">
              <div>• Pedido de Permissão + Câmera Frontal</div>
              <div>• Consulta de URL no Supabase Storage</div>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          <div className="flex-1">
            <span className="text-xs text-slate-500 font-mono">PASSO 3</span>
            <h5 className="text-sm font-semibold text-white">Reprodução Contínua</h5>
            <p className="text-[11px] text-slate-400">
              Vídeo inicializa em mudo com loop contínuo e câmera ao vivo sem atraso.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Supabase Integration Modes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          3. Métodos de Acesso ao Supabase
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h4 className="font-semibold text-white mb-1 text-sm">Opção A: Storage - URL Pública</h4>
            <p className="text-slate-400 mb-3 text-[11px]">
              Ideal para vídeos instrutivos genéricos, guias de alinhamento e animações de onboarding abertas.
            </p>
            <pre className="p-2.5 rounded bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
              <code>{`final url = supabase.storage\n  .from('templates')\n  .getPublicUrl('guide.mp4');`}</code>
            </pre>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h4 className="font-semibold text-white mb-1 text-sm">Opção B: Storage - URL Assinada (Signed)</h4>
            <p className="text-slate-400 mb-3 text-[11px]">
              Ideal para biometrias protegidas, documentos KYC e vídeos confidenciais com expiração temporária.
            </p>
            <pre className="p-2.5 rounded bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto">
              <code>{`final signedUrl = await supabase.storage\n  .from('secure-kyc')\n  .createSignedUrl('ref.mp4', 3600);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
