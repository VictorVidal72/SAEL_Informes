import type { AyuntamientoRow, ContactoRow, ExpedienteRow } from './supabase';

export const DEFAULT_LOGO_URL = '/Diputacion.png';

export type TramiteType = 'requerimiento_ctpda' | 'peticion_general';

export type DbManagedField =
  | 'municipio'
  | 'cif'
  | 'codigoDir3'
  | 'direccion'
  | 'tratamiento'
  | 'nombreRepresentante'
  | 'cargoRepresentante'
  | 'solicitanteNombre'
  | 'solicitanteApellido1'
  | 'solicitanteApellido2'
  | 'personaRemision'
  | 'numeroSael'
  | 'numeroRcon'
  | 'fechaSolicitud'
  | 'fechaResolucion';

export interface SignersState {
  delegado: boolean;
  diputado: boolean;
  coordinador: boolean;
}

export interface ReportFormData {
  ayuntamientoId: string;
  expedienteId: string;
  tipoTramite: TramiteType;
  llevaOficioRemision: boolean;
  numeroInforme: string;
  numeroSael: string;
  numeroExterno: string;
  numeroRcon: string;
  fechaSolicitud: string;
  fechaResolucion: string;
  servicio: string;
  area: string;
  asunto: string;
  medioSolicitud: string;
  municipio: string;
  cif: string;
  codigoDir3: string;
  direccion: string;
  tratamiento: string;
  nombreRepresentante: string;
  cargoRepresentante: string;
  solicitanteNombre: string;
  solicitanteApellido1: string;
  solicitanteApellido2: string;
  personaRemision: string;
  inicialesResponsable: string;
  inicialesRedactor: string;
  hecho1: string;
  hecho2: string;
  hecho3: string;
  normativa1: string;
  normativa2: string;
  normativa3: string;
  derechos1: string;
  conclusion1: string;
  logoUrl: string;
  firmantes: SignersState;
}

export interface ReportDataBundle {
  ayuntamiento: AyuntamientoRow;
  contactoPrincipal: ContactoRow | null;
  expedientes: ExpedienteRow[];
}

export interface ChecklistItem {
  field: keyof ReportFormData;
  label: string;
  source: 'database' | 'manual';
  value: string;
}

export const DB_MANAGED_FIELDS: DbManagedField[] = [
  'municipio',
  'cif',
  'codigoDir3',
  'direccion',
  'tratamiento',
  'nombreRepresentante',
  'cargoRepresentante',
  'solicitanteNombre',
  'solicitanteApellido1',
  'solicitanteApellido2',
  'personaRemision',
  'numeroSael',
  'numeroRcon',
  'fechaSolicitud',
  'fechaResolucion'
];

export const FIELD_LABELS: Record<keyof ReportFormData, string> = {
  ayuntamientoId: 'Ayuntamiento',
  expedienteId: 'Expediente',
  tipoTramite: 'Tipo de trámite',
  llevaOficioRemision: 'Lleva oficio de remisión',
  numeroInforme: 'Número de informe',
  numeroSael: 'Número SAEL',
  numeroExterno: 'Número Externo',
  numeroRcon: 'Número RCON',
  fechaSolicitud: 'Fecha de solicitud',
  fechaResolucion: 'Fecha de resolución',
  servicio: 'Servicio',
  area: 'Área',
  asunto: 'Asunto',
  medioSolicitud: 'Medio de solicitud',
  municipio: 'Municipio',
  cif: 'CIF',
  codigoDir3: 'Código DIR3',
  direccion: 'Dirección',
  tratamiento: 'Tratamiento',
  nombreRepresentante: 'Nombre del representante',
  cargoRepresentante: 'Cargo del representante',
  solicitanteNombre: 'Solicitante nombre',
  solicitanteApellido1: 'Solicitante apellido 1',
  solicitanteApellido2: 'Solicitante apellido 2',
  personaRemision: 'Persona de remisión',
  inicialesResponsable: 'Iniciales responsable',
  inicialesRedactor: 'Iniciales redactor',
  hecho1: 'Hecho 1',
  hecho2: 'Hecho 2',
  hecho3: 'Hecho 3',
  normativa1: 'Normativa 1',
  normativa2: 'Normativa 2',
  normativa3: 'Normativa 3',
  derechos1: 'Fundamentos de derecho',
  conclusion1: 'Conclusión',
  logoUrl: 'Logo URL',
  firmantes: 'Firmantes'
};

export function createEmptyReportForm(): ReportFormData {
  return {
    ayuntamientoId: '',
    expedienteId: '',
    tipoTramite: 'peticion_general',
    llevaOficioRemision: false,
    numeroInforme: '',
    numeroSael: '',
    numeroExterno: '',
    numeroRcon: '',
    fechaSolicitud: '',
    fechaResolucion: '',
    servicio: 'Servicio de Asistencia a Entidades Locales',
    area: 'Asistencia a Municipios',
    asunto: 'Nombramiento de Delegado de Protección de Datos',
    medioSolicitud: 'Sede electrónica',
    municipio: '',
    cif: '',
    codigoDir3: '',
    direccion: '',
    tratamiento: '',
    nombreRepresentante: '',
    cargoRepresentante: '',
    solicitanteNombre: '',
    solicitanteApellido1: '',
    solicitanteApellido2: '',
    personaRemision: '',
    inicialesResponsable: '',
    inicialesRedactor: '',
    hecho1: '',
    hecho2: '',
    hecho3: '',
    normativa1: '',
    normativa2: '',
    normativa3: '',
    derechos1: '',
    conclusion1: '',
    logoUrl: DEFAULT_LOGO_URL,
    firmantes: {
      delegado: true,
      diputado: true,
      coordinador: true
    }
  };
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function formatInputDate(value: string | null | undefined): string {
  const rawValue = normalizeText(value);
  if (!rawValue) {
    return '';
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string): string {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  return value;
}

function splitFullName(fullName: string) {
  const segments = fullName.split(/\s+/).filter(Boolean);

  if (segments.length === 0) {
    return {
      solicitanteNombre: '',
      solicitanteApellido1: '',
      solicitanteApellido2: ''
    };
  }

  if (segments.length === 1) {
    return {
      solicitanteNombre: segments[0],
      solicitanteApellido1: '',
      solicitanteApellido2: ''
    };
  }

  if (segments.length === 2) {
    return {
      solicitanteNombre: segments[0],
      solicitanteApellido1: segments[1],
      solicitanteApellido2: ''
    };
  }

  return {
    solicitanteNombre: segments.slice(0, -2).join(' '),
    solicitanteApellido1: segments.at(-2) ?? '',
    solicitanteApellido2: segments.at(-1) ?? ''
  };
}

export function mapDbDataToForm(
  ayuntamiento: AyuntamientoRow,
  contacto: ContactoRow | null,
  expediente: ExpedienteRow | null,
  currentValues: ReportFormData
): ReportFormData {
  const representativeName = normalizeText(contacto?.nombre_completo);
  const splitName = splitFullName(representativeName);

  return {
    ...createEmptyReportForm(),
    tipoTramite: currentValues.tipoTramite,
    llevaOficioRemision: currentValues.llevaOficioRemision,
    numeroInforme: normalizeText(expediente?.num_informe) || currentValues.numeroInforme,
    numeroExterno:
      normalizeText(expediente?.num_expediente_externo) || currentValues.numeroExterno,
    servicio: currentValues.servicio,
    area: currentValues.area,
    asunto: normalizeText(expediente?.asunto) || currentValues.asunto,
    medioSolicitud:
      normalizeText(expediente?.medio_solicitud) || currentValues.medioSolicitud,
    inicialesResponsable: currentValues.inicialesResponsable,
    inicialesRedactor: currentValues.inicialesRedactor,
    hecho1: currentValues.hecho1,
    hecho2: currentValues.hecho2,
    hecho3: currentValues.hecho3,
    normativa1: currentValues.normativa1,
    normativa2: currentValues.normativa2,
    normativa3: currentValues.normativa3,
    derechos1: currentValues.derechos1,
    conclusion1: currentValues.conclusion1,
    logoUrl: currentValues.logoUrl,
    firmantes: currentValues.firmantes,
    ayuntamientoId: String(ayuntamiento.id),
    expedienteId: expediente ? String(expediente.id) : '',
    municipio: ayuntamiento.nombre,
    cif: ayuntamiento.cif,
    codigoDir3: normalizeText(ayuntamiento.codigo_dir3),
    direccion: normalizeText(ayuntamiento.direccion_sede),
    tratamiento: normalizeText(contacto?.tratamiento),
    nombreRepresentante: representativeName,
    cargoRepresentante: normalizeText(contacto?.cargo),
    solicitanteNombre: splitName.solicitanteNombre,
    solicitanteApellido1: splitName.solicitanteApellido1,
    solicitanteApellido2: splitName.solicitanteApellido2,
    personaRemision: representativeName,
    numeroSael: normalizeText(expediente?.num_expediente_sael),
    numeroRcon: normalizeText(expediente?.num_expediente_rcon),
    fechaSolicitud: formatInputDate(expediente?.fecha_solicitud),
    fechaResolucion: formatInputDate(expediente?.fecha_resolucion)
  };
}

export function applyExpedienteToForm(
  currentValues: ReportFormData,
  expediente: ExpedienteRow | null
): ReportFormData {
  return {
    ...currentValues,
    expedienteId: expediente ? String(expediente.id) : '',
    numeroInforme: normalizeText(expediente?.num_informe) || currentValues.numeroInforme,
    numeroSael: normalizeText(expediente?.num_expediente_sael),
    numeroExterno:
      normalizeText(expediente?.num_expediente_externo) || currentValues.numeroExterno,
    numeroRcon: normalizeText(expediente?.num_expediente_rcon),
    fechaSolicitud: formatInputDate(expediente?.fecha_solicitud),
    fechaResolucion: formatInputDate(expediente?.fecha_resolucion),
    asunto: normalizeText(expediente?.asunto) || currentValues.asunto,
    medioSolicitud:
      normalizeText(expediente?.medio_solicitud) || currentValues.medioSolicitud
  };
}

export function buildSignatureCode(values: ReportFormData): string {
  const responsable = values.inicialesResponsable.trim().toUpperCase();
  const redactor = values.inicialesRedactor.trim().toLowerCase();
  return [responsable, redactor].filter(Boolean).join('/');
}

export function buildApplicantFullName(values: ReportFormData): string {
  return [
    values.solicitanteNombre,
    values.solicitanteApellido1,
    values.solicitanteApellido2
  ]
    .filter(Boolean)
    .join(' ');
}

export function requiresRemisionDocument(values: Pick<ReportFormData, 'tipoTramite' | 'llevaOficioRemision'>): boolean {
  return values.tipoTramite === 'requerimiento_ctpda' || values.llevaOficioRemision;
}

export function getRequiredFieldsByTramite(values: Pick<ReportFormData, 'tipoTramite' | 'llevaOficioRemision'>): Array<keyof ReportFormData> {
  const baseFields: Array<keyof ReportFormData> = [
    'ayuntamientoId',
    'tipoTramite',
    'numeroInforme',
    'fechaSolicitud',
    'medioSolicitud',
    'asunto',
    'inicialesResponsable',
    'inicialesRedactor'
  ];

  if (values.tipoTramite === 'requerimiento_ctpda') {
    baseFields.push('numeroRcon');
  }

  if (requiresRemisionDocument(values)) {
    baseFields.push('codigoDir3');
  }

  return Array.from(new Set(baseFields));
}

export function buildChecklist(
  values: ReportFormData,
  dbLoadedFields: Set<DbManagedField>
): { recovered: ChecklistItem[]; missing: ChecklistItem[] } {
  const requiredFields = getRequiredFieldsByTramite(values);
  const recovered: ChecklistItem[] = [];
  const missing: ChecklistItem[] = [];

  for (const field of requiredFields) {
    const rawValue = values[field];
    const stringValue = typeof rawValue === 'string' ? rawValue.trim() : '';
    const item: ChecklistItem = {
      field,
      label: FIELD_LABELS[field],
      source: dbLoadedFields.has(field as DbManagedField) ? 'database' : 'manual',
      value: stringValue
    };

    if (stringValue) {
      recovered.push(item);
    } else {
      missing.push(item);
    }
  }

  return { recovered, missing };
}

export function buildReportPreview(values: ReportFormData): string {
  const applicant = buildApplicantFullName(values);
  const signatureCode = buildSignatureCode(values);
  const introduction = requiresRemisionDocument(values)
    ? `Recibida petición mediante ${values.medioSolicitud} de fecha ${formatDisplayDate(values.fechaSolicitud)} de ${applicant} del ${values.servicio} del Área de ${values.area} del Ayuntamiento de ${values.municipio}, solicitando asistencia técnica en materia de Protección de Datos.`
    : `Se emite informe en relación con el expediente ${values.numeroSael} del Ayuntamiento de ${values.municipio}.`;

  return `${signatureCode}

Nº Informe: ${values.numeroInforme}
Nº Expediente SAEL: ${values.numeroSael}
Nº Expediente Externo: ${values.numeroExterno}
Nº Expediente RCON: ${values.numeroRcon}

ASUNTO: Informe sobre ${values.asunto}.

${introduction}

ANTECEDENTES DE HECHO:
1. ${values.hecho1}
2. ${values.hecho2}
3. ${values.hecho3}

NORMATIVA:
1. ${values.normativa1}
2. ${values.normativa2}
3. ${values.normativa3}

FUNDAMENTOS DE DERECHO:
${values.derechos1}

CONCLUSIONES:
${values.conclusion1}`;
}
