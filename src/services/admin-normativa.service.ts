import { supabase, type NormativaRow } from '../lib/supabase';

export interface NormativaInput {
  titulo: string;
  texto_legal: string;
  categoria: string;
  es_obligatoria: boolean;
}

export async function fetchNormativas(): Promise<NormativaRow[]> {
  const { data, error } = await supabase
    .from('Normativa')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las normativas: ${error.message}`);
  }

  return (data as NormativaRow[]) ?? [];
}

export async function createNormativa(input: NormativaInput): Promise<NormativaRow> {
  const { data, error } = await supabase
    .from('Normativa')
    .insert({
      titulo: input.titulo,
      texto_legal: input.texto_legal || null,
      categoria: input.categoria || 'General',
      es_obligatoria: input.es_obligatoria
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo crear la normativa: ${error.message}`);
  }

  return data as NormativaRow;
}

export async function updateNormativa(
  id: string,
  input: NormativaInput
): Promise<NormativaRow> {
  const { data, error } = await supabase
    .from('Normativa')
    .update({
      titulo: input.titulo,
      texto_legal: input.texto_legal || null,
      categoria: input.categoria || 'General',
      es_obligatoria: input.es_obligatoria
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar la normativa: ${error.message}`);
  }

  return data as NormativaRow;
}

export async function deleteNormativa(id: string): Promise<void> {
  const { error } = await supabase.from('Normativa').delete().eq('id', id);

  if (error) {
    throw new Error(`No se pudo borrar la normativa: ${error.message}`);
  }
}
