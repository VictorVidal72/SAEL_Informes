import type { AyuntamientoRow, ContactoRow, ExpedienteRow } from './supabase';

export const DEFAULT_LOGO_URL = '/Diputacion.png';

export type DbManagedField =
  | 'municipio'
  | 'cif'
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

export const DB_MANAGED_FIELDS: DbManagedField[] = [
  'municipio',
  'cif',
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

export function createEmptyReportForm(): ReportFormData {
  return {
    ayuntamientoId: '',
    expedienteId: '',
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
    llevaOficioRemision: currentValues.llevaOficioRemision,
    servicio: currentValues.servicio,
    area: currentValues.area,
    asunto: currentValues.asunto,
    medioSolicitud: currentValues.medioSolicitud,
    inicialesResponsable: currentValues.inicialesResponsable,
    inicialesRedactor: currentValues.inicialesRedactor,
    numeroInforme: currentValues.numeroInforme,
    numeroExterno: currentValues.numeroExterno,
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
    numeroSael: normalizeText(expediente?.num_expediente_sael),
    numeroRcon: normalizeText(expediente?.num_expediente_rcon),
    fechaSolicitud: formatInputDate(expediente?.fecha_solicitud),
    fechaResolucion: formatInputDate(expediente?.fecha_resolucion)
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

export function validateReportForm(values: ReportFormData): Array<keyof ReportFormData> {
  const requiredFields: Array<keyof ReportFormData> = [
    'ayuntamientoId',
    'numeroInforme',
    'numeroSael',
    'numeroRcon',
    'asunto',
    'inicialesResponsable',
    'inicialesRedactor'
  ];

  if (values.llevaOficioRemision) {
    requiredFields.push('personaRemision', 'medioSolicitud', 'fechaSolicitud');
  }

  return requiredFields.filter((field) => {
    const value = values[field];
    return typeof value === 'string' ? value.trim() === '' : !value;
  });
}

export function buildReportPreview(values: ReportFormData): string {
  const applicant = buildApplicantFullName(values);
  const signatureCode = buildSignatureCode(values);

  return `${signatureCode}

Nº Informe: ${values.numeroInforme}
Nº Expediente SAEL: ${values.numeroSael}
Nº Expediente Externo: ${values.numeroExterno}
Nº Expediente RCON: ${values.numeroRcon}

ASUNTO: Informe sobre ${values.asunto}.

${
    values.llevaOficioRemision
      ? `Recibida petición mediante ${values.medioSolicitud} de fecha ${formatDisplayDate(values.fechaSolicitud)} de ${applicant} del ${values.servicio} del Área de ${values.area} del Ayuntamiento de ${values.municipio}, solicitando asistencia técnica en materia de Protección de Datos.`
      : `Se emite informe en relación con el expediente ${values.numeroSael} del Ayuntamiento de ${values.municipio}.`
  }

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
