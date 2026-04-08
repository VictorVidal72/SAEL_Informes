import { pdf, type ReactPDF } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import {
  buildSignatureCode,
  requiresRemisionDocument,
  type ReportFormData
} from '../lib/report-model';
import { supabase } from '../lib/supabase';

interface GenerarYGuardarPdfParams {
  pdfComponent: ReactElement;
  nombreDocumento: string;
  formData: ReportFormData;
}

export interface GeneratedPdfResult {
  fileName: string;
  publicUrl: string;
}

export async function generarYGuardarPDF({
  pdfComponent,
  nombreDocumento,
  formData
}: GenerarYGuardarPdfParams): Promise<GeneratedPdfResult> {
  const blob = await pdf(pdfComponent as ReactPDF.Node).toBlob();
  const expedienteId = formData.expedienteId || 'sin-expediente';
  const fileName = `${nombreDocumento}_${expedienteId}_${Date.now()}.pdf`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from('informes')
    .upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`No se pudo subir el PDF al almacenamiento: ${uploadError.message}`);
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from('informes').getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error('No se pudo obtener la URL publica del PDF.');
  }

  const { error: insertError } = await supabase.from('Informe').insert({
    expediente_id: formData.expedienteId,
    nombre_informe: nombreDocumento,
    datos_formulario: formData,
    pdf_url: publicUrl,
    requiere_oficio_remision: requiresRemisionDocument(formData),
    iniciales_firmantes: buildSignatureCode(formData)
  });

  if (insertError) {
    throw new Error(`No se pudo registrar el PDF en base de datos: ${insertError.message}`);
  }

  return {
    fileName,
    publicUrl
  };
}
