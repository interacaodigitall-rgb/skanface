import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Sanitiza a URL do Supabase para garantir a URL raiz do projeto
 * Remove sufixos como /rest/v1, /rest/v1/, /storage/v1 ou barras extras no final
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Remove /rest/v1 ou variações
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/storage\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  const cleanUrl = sanitizeSupabaseUrl(config.supabaseUrl);
  if (!cleanUrl || !config.supabaseAnonKey) {
    return null;
  }

  const key = `${cleanUrl}_${config.supabaseAnonKey}`;
  if (cachedClient && currentConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cleanUrl, config.supabaseAnonKey);
    currentConfigKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

/**
 * Testa a conexão com o Supabase e tenta listar os buckets ou verificar o status
 */
export async function testSupabaseConnection(config: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  buckets?: string[];
}> {
  const cleanUrl = sanitizeSupabaseUrl(config.supabaseUrl);
  if (!cleanUrl) {
    return { success: false, message: 'URL do projeto Supabase não informada.' };
  }

  // Se não tiver anonKey, verifica pelo menos se o endpoint responde
  if (!config.supabaseAnonKey) {
    try {
      const response = await fetch(`${cleanUrl}/rest/v1/`, { method: 'GET' });
      // Se responder 200, 400 ou 401, o servidor Supabase está online e ativo!
      if (response.status === 401 || response.status === 200 || response.status === 400) {
        return {
          success: true,
          message: 'Instância do Supabase online! Informe a sua Chave Anon (anon_key) para autenticar requisições de Storage/Banco.',
        };
      }
      return { success: true, message: `Instância detectada (Status HTTP ${response.status}).` };
    } catch {
      return {
        success: false,
        message: 'Não foi possível conectar ao endpoint Supabase informado. Verifique sua rede e CORS.',
      };
    }
  }

  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Não foi possível inicializar o cliente Supabase.' };
  }

  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      return {
        success: false,
        message: `Erro de Storage: ${error.message}. Verifique as políticas de RLS e se a chave Anon está correta.`,
      };
    }
    return {
      success: true,
      message: `Conectado com sucesso! ${buckets?.length || 0} bucket(s) localizados.`,
      buckets: buckets?.map((b) => b.name),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao testar Storage: ${msg}` };
  }
}

export async function fetchVideoUrlFromSupabase(
  config: SupabaseConfig,
  fallbackUrl: string
): Promise<{ url: string; source: 'supabase_storage' | 'supabase_table' | 'sample_fallback'; error?: string }> {
  const cleanUrl = sanitizeSupabaseUrl(config.supabaseUrl);

  // Se o usuário configurou URL do Supabase mas não tem a chave, podemos ainda montar a URL pública do Storage se o bucket for público
  if (cleanUrl && config.bucketName && config.filePath && config.fetchMode === 'public_url') {
    const directPublicUrl = `${cleanUrl}/storage/v1/object/public/${config.bucketName}/${config.filePath}`;
    return { url: directPublicUrl, source: 'supabase_storage' };
  }

  const client = getSupabaseClient(config);

  if (!client) {
    return {
      url: fallbackUrl,
      source: 'sample_fallback',
      error: 'Chave Anon do Supabase pendente. Usando vídeo de referência demonstrativo.',
    };
  }

  try {
    if (config.fetchMode === 'public_url') {
      const { data } = client.storage
        .from(config.bucketName)
        .getPublicUrl(config.filePath);

      if (!data?.publicUrl) {
        throw new Error(`Não foi possível gerar URL pública para o bucket ${config.bucketName}/${config.filePath}`);
      }
      return { url: data.publicUrl, source: 'supabase_storage' };
    }

    if (config.fetchMode === 'signed_url') {
      const { data, error } = await client.storage
        .from(config.bucketName)
        .createSignedUrl(config.filePath, 3600); // 1 hora de expiração

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Erro ao gerar URL assinada no Supabase Storage');
      }
      return { url: data.signedUrl, source: 'supabase_storage' };
    }

    if (config.fetchMode === 'database_table') {
      const table = config.tableName || 'video_configs';
      const { data, error } = await client
        .from(table)
        .select('video_url')
        .limit(1)
        .single();

      if (error || !data?.video_url) {
        throw new Error(error?.message || `Nenhuma URL de vídeo encontrada na tabela ${table}`);
      }
      return { url: data.video_url, source: 'supabase_table' };
    }

    return { url: fallbackUrl, source: 'sample_fallback' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[SupabaseService] Erro ao buscar do Supabase:', message);
    return {
      url: fallbackUrl,
      source: 'sample_fallback',
      error: `Supabase: ${message}. Exibindo vídeo de referência para manter fluxo operacional.`,
    };
  }
}
