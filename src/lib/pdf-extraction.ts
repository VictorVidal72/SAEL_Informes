export interface ExtractedPdfData {
  numero_rcon?: string;
  numero_externo?: string;
  fecha_solicitud?: string;
  fecha_firma?: string;
  peticionario_nombre?: string;
  entidad_reclamada?: string;
  motivo_reclamacion?: string;
  asunto?: string;
  plazo_respuesta?: string;
  codigo_dir_origen?: string;
  codigo_dir_destino?: string;
  csv?: string;
  url_validacion?: string;
}

export function extractPdfAdministrativeData(pdfText: string): ExtractedPdfData {
  const data: ExtractedPdfData = {};

  // Limpiamos el texto para que las búsquedas no fallen por saltos de página
  const cleanText = pdfText.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n');

  const matchRcon = cleanText.match(/(?:Ref\.|Expediente|RESUMEN)[^\w]*([A-Z]{2,3}-\d{4}\/\d{3,4})/i);
  if (matchRcon && matchRcon[1]) data.numero_rcon = matchRcon[1].trim();

  const matchExterno = cleanText.match(/(?:Nº\s*REGISTRO|Número\s*de\s*registro)[\s:]*([A-Z0-9-]+)/i);
  if (matchExterno && matchExterno[1]) data.numero_externo = matchExterno[1].trim();

  const matchFechaSol = cleanText.match(/(?:Fecha\s*de\s*entrada|Fecha\s*y\s*hora(?:[\s\w]*))[\s:]*([\d]{2}[/-][\d]{2}[/-][\d]{4}|[\d]{1,2}\s+de\s+[a-z]+\s+de\s+[\d]{4})/i);
  if (matchFechaSol && matchFechaSol[1]) data.fecha_solicitud = matchFechaSol[1].trim();

  const matchAsunto = cleanText.match(/(?:Asunto|ASUNTO)\s*[:\-]\s*(.+)/i);
  if (matchAsunto && matchAsunto[1]) data.asunto = matchAsunto[1].trim();

  const matchEntidad = cleanText.match(/(?:Entidad reclamada|Entidad responsable de tratamiento)[\s\n]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\n|DPD|Motivo|Cargo)/i);
  if (matchEntidad && matchEntidad[1]) data.entidad_reclamada = matchEntidad[1].trim();

  const matchMotivo = cleanText.match(/Motivo de la reclama-?\s*ción[\s\n]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s.,]+?)(?:\nEl artículo|El artículo|\nFIRMADO)/i);
  if (matchMotivo && matchMotivo[1]) {
    data.motivo_reclamacion = matchMotivo[1].replace(/-\s*\n\s*/g, '').replace(/\s+/g, ' ').trim();
  }

  const matchFechaFirma = cleanText.match(/(?:Fecha Firma:\s*|FIRMADO POR.*?\n.*?\n|PÁG\.\s*\d+\/\d+\s*\n)([\d]{2}\/[\d]{2}\/[\d]{4})/i);
  if (matchFechaFirma && matchFechaFirma[1]) data.fecha_firma = matchFechaFirma[1].trim();

  const matchCsv = cleanText.match(/(?:código de VERIFICACIÓN|Cód\. Validación:|CSV:)[\s\n]*([A-Z0-9]{15,40})/i);
  if (matchCsv && matchCsv[1]) data.csv = matchCsv[1].trim();

  const matchUrl = cleanText.match(/(https:\/\/[^\s]+(?:verificar|sedelectronica)[^\s]*)/i);
  if (matchUrl && matchUrl[1]) data.url_validacion = matchUrl[1].trim();

  const matchReclamante = cleanText.match(/Reclamante[\s\n]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)Representante/i);
  if (matchReclamante && matchReclamante[1]) data.peticionario_nombre = matchReclamante[1].trim();

  const matchPlazo = cleanText.match(/plazo\s+máximo\s+de\s+([a-záéíóúñ\s\d]+),/i);
  if (matchPlazo && matchPlazo[1]) data.plazo_respuesta = matchPlazo[1].trim();

  const matchDir = cleanText.match(/\b([AL]\d{8})\b/g);
  if (matchDir && matchDir.length > 0) {
    data.codigo_dir_origen = matchDir.find(code => code.startsWith('A')) || matchDir[0];
    data.codigo_dir_destino = matchDir.find(code => code.startsWith('L')) || (matchDir[1] ? matchDir[1] : undefined);
  }

  return data;
}

function normalizeExtractedValue(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function pickFirstMeaningful(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = normalizeExtractedValue(value);
    if (normalized) return normalized;
  }

  return undefined;
}

function pickLongestMeaningful(...values: Array<string | undefined>): string | undefined {
  const normalizedValues = values
    .map((value) => normalizeExtractedValue(value))
    .filter((value): value is string => Boolean(value));

  if (normalizedValues.length === 0) {
    return undefined;
  }

  return normalizedValues.sort((left, right) => right.length - left.length)[0];
}

export function mergeExtractedPdfData(items: ExtractedPdfData[]): ExtractedPdfData {
  return items.reduce<ExtractedPdfData>(
    (accumulator, item) => ({
      numero_rcon: pickFirstMeaningful(accumulator.numero_rcon, item.numero_rcon),
      numero_externo: pickFirstMeaningful(accumulator.numero_externo, item.numero_externo),
      fecha_solicitud: pickFirstMeaningful(accumulator.fecha_solicitud, item.fecha_solicitud),
      fecha_firma: pickFirstMeaningful(accumulator.fecha_firma, item.fecha_firma),
      asunto: pickLongestMeaningful(accumulator.asunto, item.asunto),
      peticionario_nombre: pickLongestMeaningful(
        accumulator.peticionario_nombre,
        item.peticionario_nombre
      ),
      entidad_reclamada: pickLongestMeaningful(
        accumulator.entidad_reclamada,
        item.entidad_reclamada
      ),
      motivo_reclamacion: pickLongestMeaningful(
        accumulator.motivo_reclamacion,
        item.motivo_reclamacion
      ),
      plazo_respuesta: pickLongestMeaningful(accumulator.plazo_respuesta, item.plazo_respuesta),
      codigo_dir_origen: pickFirstMeaningful(
        accumulator.codigo_dir_origen,
        item.codigo_dir_origen
      ),
      codigo_dir_destino: pickFirstMeaningful(
        accumulator.codigo_dir_destino,
        item.codigo_dir_destino
      ),
      csv: pickFirstMeaningful(accumulator.csv, item.csv),
      url_validacion: pickFirstMeaningful(accumulator.url_validacion, item.url_validacion)
    }),
    {}
  );
}
