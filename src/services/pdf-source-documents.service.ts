import { supabase } from '../lib/supabase';
import type { ExtractedPdfData } from '../lib/pdf-extraction';

export interface UploadedPdfSource {
  fileName: string;
  filePath: string;
  publicUrl: string;
}

export interface ExtractPdfDocumentsResponse {
  documents: Array<{
    fileName: string;
    extracted: ExtractedPdfData;
  }>;
  merged: ExtractedPdfData;
}

function sanitizeSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function buildSourcePdfPath(fileName: string, expedienteId?: string): string {
  const expedienteSegment = sanitizeSegment(expedienteId || 'sin-expediente');
  const nameSegment = sanitizeSegment(fileName || 'documento.pdf') || 'documento.pdf';
  return `fuentes-expediente/${expedienteSegment}/${Date.now()}_${nameSegment}`;
}

export async function uploadPdfSourceDocuments(
  files: File[],
  expedienteId?: string
): Promise<UploadedPdfSource[]> {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const filePath = buildSourcePdfPath(file.name, expedienteId);
      const { error } = await supabase.storage.from('informes').upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false
      });

      if (error) {
        throw new Error(`No se pudo subir "${file.name}" al bucket: ${error.message}`);
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('informes').getPublicUrl(filePath);

      return {
        fileName: file.name,
        filePath,
        publicUrl
      };
    })
  );

  return uploads;
}

export async function extractPdfSourceDocuments(
  files: File[]
): Promise<ExtractPdfDocumentsResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/extraer-pdf', {
    method: 'POST',
    body: formData
  });

  const payload = (await response.json()) as ExtractPdfDocumentsResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'No se pudieron analizar los documentos.');
  }

  return payload;
}
