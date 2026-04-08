import { supabase } from '../lib/supabase';

export interface StorageFileItem {
  id: string;
  name: string;
  path: string;
  size: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  publicUrl: string;
}

export async function fetchStorageFiles(): Promise<StorageFileItem[]> {
  const { data, error } = await supabase.storage
    .from('informes')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    throw new Error(`No se pudieron cargar los archivos del bucket: ${error.message}`);
  }

  return (data ?? []).map((file) => ({
    id: file.id ?? file.name,
    name: file.name,
    path: file.name,
    size: file.metadata?.size ?? null,
    createdAt: file.created_at ?? null,
    updatedAt: file.updated_at ?? null,
    publicUrl: supabase.storage.from('informes').getPublicUrl(file.name).data.publicUrl
  }));
}

export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from('informes').remove([path]);

  if (error) {
    throw new Error(`No se pudo eliminar el archivo del bucket: ${error.message}`);
  }
}
