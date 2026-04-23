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
  const formPayload: ReportFormData = {
    ...formData,
    asunto: formData.asunto ?? '',
    fecha_firma: formData.fecha_firma ?? '',
    entidad_reclamada: formData.entidad_reclamada ?? '',
    motivo_reclamacion: formData.motivo_reclamacion ?? '',
    csv: formData.csv ?? '',
    url_validacion: formData.url_validacion ?? ''
  };
  const blob = await pdf(pdfComponent as ReactPDF.Node).toBlob();
  const expedienteId = formPayload.expedienteId.trim();
  const expedienteIdForDb = expedienteId === '' ? null : expedienteId;
  const expedienteSegment = expedienteIdForDb ?? 'sin-expediente';
  const fileName = `${nombreDocumento}_${expedienteSegment}_${Date.now()}.pdf`;
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
    expediente_id: expedienteIdForDb,
    nombre_informe: nombreDocumento,
    datos_formulario: formPayload,
    pdf_url: publicUrl,
    requiere_oficio_remision: requiresRemisionDocument(formPayload),
    iniciales_firmantes: buildSignatureCode(formPayload)
  });

  if (insertError) {
    throw new Error(`No se pudo registrar el PDF en base de datos: ${insertError.message}`);
  }

  return {
    fileName,
    publicUrl
  };
}
