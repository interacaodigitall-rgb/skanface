import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Terminal, AlertTriangle, CheckCircle2, Cloud, Github } from 'lucide-react';

interface VercelDeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployGuideModal: React.FC<VercelDeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `# 1. Inicialize o repositório git localmente
git init

# 2. Adicione todos os arquivos do projeto
git add .

# 3. Crie o primeiro commit
git commit -m "feat: face camera oval overlay supabase"

# 4. Renomeie a branch principal para main
git branch -M main

# 5. Conecte ao seu repositório do GitHub (substitua com o seu link)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# 6. Envie o código para o GitHub
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-white">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Guia de Deploy no Vercel via GitHub
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded">
                  vercel.json Configurado
                </span>
              </h3>
              <p className="text-xs text-slate-400">Como resolver os erros comuns e publicar seu projeto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Motivo mais comum do erro no Vercel */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4">
            <h4 className="font-semibold text-amber-300 text-sm mb-1.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Por que o Vercel falha ao importar do GitHub?
            </h4>
            <ul className="space-y-1.5 text-slate-300 text-xs list-disc list-inside">
              <li>
                <strong>Framework incorreto:</strong> O Vercel pode tentar compilar como Create React App (esperando pasta <code>build/</code>) em vez de <strong>Vite</strong> (que gera <code>dist/</code>).
              </li>
              <li>
                <strong>Root Directory:</strong> Se o código estiver dentro de uma subpasta no GitHub, você precisa apontar o Root Directory no Vercel.
              </li>
              <li>
                <strong>Flutter vs Web:</strong> O Vercel hospeda o simulador web em Vite/React. O código Flutter que criamos é para dispositivos móveis ou compilado separadamente.
              </li>
            </ul>
          </div>

          {/* O que já configuramos para você */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Já criamos o arquivo <code className="text-emerald-400">vercel.json</code> no projeto:
            </h4>
            <pre className="p-3 bg-slate-900 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
              <code>{`{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}</code>
            </pre>
            <p className="text-[11px] text-slate-400 mt-2">
              Isso força o Vercel a usar o compilador Vite, enviar a pasta <code>dist</code> e redirecionar rotas SPA sem erros 404!
            </p>
          </div>

          {/* Passo a Passo no Vercel */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              Configuração Exata na Tela do Vercel
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Framework Preset</span>
                <span className="font-semibold text-white">Vite</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Build Command</span>
                <span className="font-semibold text-white">npm run build</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Output Directory</span>
                <span className="font-semibold text-white">dist</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Install Command</span>
                <span className="font-semibold text-white">npm install</span>
              </div>
            </div>
          </div>

          {/* Comandos Git para Enviar ao GitHub */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                <Github className="w-4 h-4 text-purple-400" />
                Como Enviar este Projeto para o seu GitHub
              </h4>
              <button
                onClick={() => handleCopy(gitCommands, 1)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 1 ? 'Copiado!' : 'Copiar Comandos'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
              <code>{gitCommands}</code>
            </pre>
          </div>

          {/* Alternativa Direta via Vercel CLI */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <h5 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Alternativa Rápida: Publicar direto pelo Terminal (Sem GitHub)
              </h5>
              <button
                onClick={() => handleCopy('npm i -g vercel && vercel --prod', 2)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {copiedIndex === 2 ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Se você tiver o Node instalado na sua máquina, pode publicar em 1 minuto sem precisar configurar o GitHub:
            </p>
            <code className="block p-2 bg-slate-900 rounded font-mono text-emerald-300 text-[11px]">
              npm i -g vercel &amp;&amp; vercel --prod
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Abrir Painel do Vercel</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
