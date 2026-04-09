export interface ExtractedPdfData {
  referencia_rcon: string;
  fecha_registro: string;
  peticionario_nombre: string;
  plazo_respuesta: string;
  codigo_dir_origen: string;
  codigo_dir_destino: string;
}

function pickFirstMeaningful(...values: string[]): string {
  return values.map((value) => normalizeWhitespace(value)).find(Boolean) ?? '';
}

function pickLongestMeaningful(...values: string[]): string {
  return values
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0] ?? '';
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function matchFirst(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return '';
}

function findCodeNearSection(text: string, sectionLabel: string): string {
  const sectionPattern = new RegExp(
    `${sectionLabel}[\\s\\S]{0,250}?\\b([AEL]\\d{5,})\\b`,
    'i'
  );
  const match = text.match(sectionPattern);
  return match?.[1] ?? '';
}

function normalizeExtractedDate(rawValue: string): string {
  const normalizedValue = normalizeWhitespace(rawValue);
  const match = normalizedValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

  if (!match) {
    return normalizedValue;
  }

  const [, day, month, year] = match;
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function extractPdfAdministrativeData(rawText: string): ExtractedPdfData {
  const text = normalizeWhitespace(rawText);

  const referencia_rcon = matchFirst(text, [
    /\b((?:RCO|RCON|CD)-?\d{2,4}\/\d+)\b/i,
    /\b((?:RCO|RCON|CD)\/\d{2,4}\/\d+)\b/i
  ]);

  const fechaRegistroRaw = matchFirst(text, [
    /Fecha y hora de registro[:\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i,
    /Fecha de entrada[:\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i
  ]);

  const peticionario_nombre = matchFirst(text, [
    /Reclamante[:\s]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.'-]+)/i,
    /Representante[:\s]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.'-]+)/i
  ]);

  const plazo_respuesta = matchFirst(text, [
    /((?:en|dentro de)\s+el\s+plazo\s+(?:m[aá]ximo\s+)?de\s+[^.]+(?:mes|meses|d[ií]as))/i,
    /(plazo\s+(?:m[aá]ximo\s+)?de\s+[^.]+(?:mes|meses|d[ií]as))/i
  ]);

  return {
    referencia_rcon,
    fecha_registro: fechaRegistroRaw ? normalizeExtractedDate(fechaRegistroRaw) : '',
    peticionario_nombre,
    plazo_respuesta,
    codigo_dir_origen: findCodeNearSection(text, 'Origen'),
    codigo_dir_destino: findCodeNearSection(text, 'Destino')
  };
}

export function mergeExtractedPdfData(items: ExtractedPdfData[]): ExtractedPdfData {
  return items.reduce<ExtractedPdfData>(
    (accumulator, item) => ({
      referencia_rcon: pickFirstMeaningful(
        accumulator.referencia_rcon,
        item.referencia_rcon
      ),
      fecha_registro: pickFirstMeaningful(
        accumulator.fecha_registro,
        item.fecha_registro
      ),
      peticionario_nombre: pickLongestMeaningful(
        accumulator.peticionario_nombre,
        item.peticionario_nombre
      ),
      plazo_respuesta: pickLongestMeaningful(
        accumulator.plazo_respuesta,
        item.plazo_respuesta
      ),
      codigo_dir_origen: pickFirstMeaningful(
        accumulator.codigo_dir_origen,
        item.codigo_dir_origen
      ),
      codigo_dir_destino: pickFirstMeaningful(
        accumulator.codigo_dir_destino,
        item.codigo_dir_destino
      )
    }),
    {
      referencia_rcon: '',
      fecha_registro: '',
      peticionario_nombre: '',
      plazo_respuesta: '',
      codigo_dir_origen: '',
      codigo_dir_destino: ''
    }
  );
}
