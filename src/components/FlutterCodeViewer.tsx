import React, { useState } from 'react';
import { Copy, Check, FileCode, Smartphone, Terminal, Layers, AlertCircle, ShieldAlert } from 'lucide-react';
import { FLUTTER_CODE_FILES } from '../data/flutterSourceCode';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = FLUTTER_CODE_FILES[selectedFileIndex];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col max-w-6xl mx-auto p-4 md:p-6 overflow-y-auto">
      {/* Top Banner with Architecture Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                Flutter 3.x + Supabase Flutter SDK
              </span>
              <span className="text-xs text-slate-400">· Produção Verificada</span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Componente Nativo Flutter: Câmera Facial com Vídeo Oval Supabase
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Código completo pronto para compilar em iOS, Android e Flutter Web. Inclui inicialização dupla assíncrona, layout em camadas com Stack/ClipOval, volume mudo obrigatório para autoplay mobile e ciclo de vida com WidgetsBindingObserver para evitar vazamentos de memória.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado para o Clipboard!' : `Copiar ${currentFile.filename}`}</span>
            </button>
          </div>
        </div>

        {/* Requirements Compliance Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-0.5">1. Inicialização Dupla</span>
            <p className="text-slate-400 text-[11px]">
              <code className="text-emerald-400">Future.wait([camera, supabase])</code> simultâneo.
            </p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-0.5">2. Stack & ClipOval</span>
            <p className="text-slate-400 text-[11px]">
              Câmera no fundo e player de vídeo oval centralizado na frente.
            </p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-0.5">3. Configuração de Vídeo</span>
            <p className="text-slate-400 text-[11px]">
              <code className="text-emerald-400">looping: true</code>, <code className="text-emerald-400">volume: 0.0</code>, autoplay e sem controles.
            </p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-0.5">4. Zero Memory Leaks</span>
            <p className="text-slate-400 text-[11px]">
              <code className="text-emerald-400">dispose()</code> completo e suporte a background lifecycle.
            </p>
          </div>
        </div>
      </div>

      {/* Code Explorer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
        {/* File Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-900/90 px-3 py-2 border-b border-slate-800 scrollbar-none">
          {FLUTTER_CODE_FILES.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-colors ${
                selectedFileIndex === idx
                  ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* Current File Description */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{currentFile.description}</span>
          <span className="font-mono text-[11px] text-slate-500 uppercase">{currentFile.language}</span>
        </div>

        {/* Code Content */}
        <div className="relative">
          <pre className="p-4 md:p-6 text-xs md:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[580px] bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>

      {/* Senior Architectural Notes */}
      <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-300">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Notas de Engenharia & Boas Práticas de Produção (Flutter + Supabase)
        </h3>
        <ul className="space-y-2 text-slate-400 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-slate-200">Proporção Sem Distorção (BoxFit.cover):</strong> A tela calcula <code className="text-emerald-400">scale = size.aspectRatio * camera.aspectRatio</code> para que a imagem da câmera ocupe 100% da tela sem achatar nem esticar o rosto do usuário em tablets, telefones 19.5:9 ou 16:9.
          </li>
          <li>
            <strong className="text-slate-200">Políticas de Autoplay em iOS & Android:</strong> Navegadores e WebViews móveis bloqueiam rigorosamente vídeos com reprodução automática caso o som não esteja zerado. No código fornecido, <code className="text-emerald-400">setVolume(0.0)</code> é invocado imediatamente antes de <code className="text-emerald-400">play()</code>, garantindo reprodução instantânea e sem falhas.
          </li>
          <li>
            <strong className="text-slate-200">Segurança de Armazenamento no Supabase:</strong> Se seu bucket de modelos ou vídeos contiver informações restritas, utilize a flag <code className="text-emerald-400">useSignedUrl: true</code>. O cliente gera uma URL temporária com hash HMAC protegida que expira após o tempo parametrizado.
          </li>
          <li>
            <strong className="text-slate-200">Ciclo de Vida do App:</strong> Implementamos o <code className="text-emerald-400">WidgetsBindingObserver</code> para pausar o stream da câmera quando o app for colocado em background pelo usuário e reativá-lo ao retornar, prevenindo travamento do driver de câmera no iOS/Android.
          </li>
        </ul>
      </div>
    </div>
  );
};
