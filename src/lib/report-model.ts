import type { AyuntamientoRow, ContactoRow, ExpedienteRow } from './supabase';

export const DEFAULT_LOGO_URL = '/Diputacion.png';
export const DEFAULT_NORMATIVA_OBLIGATORIA =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
export const NORMATIVAS_OPCIONALES = ['Ley de Transparencia', 'RGPD'] as const;

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
  plazo_respuesta: string;
  instrucciones_contestar: string;
  peticionario_nombre: string;
  peticionario_apellidos: string;
  peticionario_correo: string;
  peticionario_telefono: string;
  peticionario_puesto: string;
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
  antecedentesHecho: string[];
  normativaObligatoria: string;
  normativasOpcionales: string[];
  normativaAdicional: string;
  fundamentosDerecho: string[];
  conclusiones: string[];
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
  tipoTramite: 'Tipo de tramite',
  llevaOficioRemision: 'Lleva oficio de remision',
  numeroInforme: 'Numero de informe',
  numeroSael: 'Numero SAEL',
  numeroExterno: 'Numero Externo',
  numeroRcon: 'Numero RCON',
  fechaSolicitud: 'Fecha de solicitud',
  fechaResolucion: 'Fecha de resolucion',
  plazo_respuesta: 'Plazo de respuesta',
  instrucciones_contestar: 'Instrucciones para contestar',
  peticionario_nombre: 'Peticionario nombre',
  peticionario_apellidos: 'Peticionario apellidos',
  peticionario_correo: 'Peticionario correo',
  peticionario_telefono: 'Peticionario telefono',
  peticionario_puesto: 'Peticionario puesto',
  servicio: 'Servicio',
  area: 'Area',
  asunto: 'Asunto',
  medioSolicitud: 'Medio de solicitud',
  municipio: 'Municipio',
  cif: 'CIF',
  codigoDir3: 'Codigo DIR3',
  direccion: 'Direccion',
  tratamiento: 'Tratamiento',
  nombreRepresentante: 'Nombre del representante',
  cargoRepresentante: 'Cargo del representante',
  solicitanteNombre: 'Solicitante nombre',
  solicitanteApellido1: 'Solicitante apellido 1',
  solicitanteApellido2: 'Solicitante apellido 2',
  personaRemision: 'Persona de remision',
  inicialesResponsable: 'Iniciales responsable',
  inicialesRedactor: 'Iniciales redactor',
  antecedentesHecho: 'Antecedentes de hecho',
  normativaObligatoria: 'Normativa obligatoria',
  normativasOpcionales: 'Normativas opcionales',
  normativaAdicional: 'Normativa adicional',
  fundamentosDerecho: 'Fundamentos de derecho',
  conclusiones: 'Conclusiones',
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
    plazo_respuesta: '',
    instrucciones_contestar: '',
    peticionario_nombre: '',
    peticionario_apellidos: '',
    peticionario_correo: '',
    peticionario_telefono: '',
    peticionario_puesto: '',
    servicio: 'Servicio de Asistencia a Entidades Locales',
    area: 'Asistencia a Municipios',
    asunto: 'Nombramiento de Delegado de Proteccion de Datos',
    medioSolicitud: 'Sede electronica',
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
    antecedentesHecho: [''],
    normativaObligatoria: DEFAULT_NORMATIVA_OBLIGATORIA,
    normativasOpcionales: [],
    normativaAdicional: '',
    fundamentosDerecho: [''],
    conclusiones: [''],
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

function normalizeStringArray(values: string[] | null | undefined): string[] {
  return (values ?? []).map((value) => value.trim());
}

function hasMeaningfulContent(values: string[] | null | undefined): boolean {
  return normalizeStringArray(values).some(Boolean);
}

function formatNumberedSection(values: string[]): string {
  const normalizedValues = normalizeStringArray(values).filter(Boolean);

  if (normalizedValues.length === 0) {
    return '(Sin contenido)';
  }

  return normalizedValues.map((value, index) => `${index + 1}. ${value}`).join('\n');
}

function formatNormativaSection(
  values: Pick<
    ReportFormData,
    'normativaObligatoria' | 'normativasOpcionales' | 'normativaAdicional'
  >
): string {
  const items = [
    values.normativaObligatoria.trim(),
    ...normalizeStringArray(values.normativasOpcionales).filter(Boolean),
    values.normativaAdicional.trim()
  ].filter(Boolean);

  if (items.length === 0) {
    return '(Sin contenido)';
  }

  return items.map((value, index) => `${index + 1}. ${value}`).join('\n');
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
    plazo_respuesta: normalizeText(expediente?.plazo_respuesta) || currentValues.plazo_respuesta,
    instrucciones_contestar:
      normalizeText(expediente?.instrucciones_contestar) || currentValues.instrucciones_contestar,
    peticionario_nombre:
      normalizeText(expediente?.peticionario_nombre) || currentValues.peticionario_nombre,
    peticionario_apellidos:
      normalizeText(expediente?.peticionario_apellidos) || currentValues.peticionario_apellidos,
    peticionario_correo:
      normalizeText(expediente?.peticionario_correo) || currentValues.peticionario_correo,
    peticionario_telefono:
      normalizeText(expediente?.peticionario_telefono) || currentValues.peticionario_telefono,
    peticionario_puesto:
      normalizeText(expediente?.peticionario_puesto) || currentValues.peticionario_puesto,
    servicio: currentValues.servicio,
    area: currentValues.area,
    asunto: normalizeText(expediente?.asunto) || currentValues.asunto,
    medioSolicitud:
      normalizeText(expediente?.medio_solicitud) || currentValues.medioSolicitud,
    inicialesResponsable: currentValues.inicialesResponsable,
    inicialesRedactor: currentValues.inicialesRedactor,
    antecedentesHecho: [...currentValues.antecedentesHecho],
    normativaObligatoria: currentValues.normativaObligatoria,
    normativasOpcionales: [...currentValues.normativasOpcionales],
    normativaAdicional: currentValues.normativaAdicional,
    fundamentosDerecho: [...currentValues.fundamentosDerecho],
    conclusiones: [...currentValues.conclusiones],
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
    plazo_respuesta: normalizeText(expediente?.plazo_respuesta) || currentValues.plazo_respuesta,
    instrucciones_contestar:
      normalizeText(expediente?.instrucciones_contestar) || currentValues.instrucciones_contestar,
    peticionario_nombre:
      normalizeText(expediente?.peticionario_nombre) || currentValues.peticionario_nombre,
    peticionario_apellidos:
      normalizeText(expediente?.peticionario_apellidos) || currentValues.peticionario_apellidos,
    peticionario_correo:
      normalizeText(expediente?.peticionario_correo) || currentValues.peticionario_correo,
    peticionario_telefono:
      normalizeText(expediente?.peticionario_telefono) || currentValues.peticionario_telefono,
    peticionario_puesto:
      normalizeText(expediente?.peticionario_puesto) || currentValues.peticionario_puesto,
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

export function requiresRemisionDocument(
  values: Pick<ReportFormData, 'tipoTramite' | 'llevaOficioRemision'>
): boolean {
  return values.tipoTramite === 'requerimiento_ctpda' || values.llevaOficioRemision;
}

export function getRequiredFieldsByTramite(
  values: Pick<ReportFormData, 'tipoTramite' | 'llevaOficioRemision'>
): Array<keyof ReportFormData> {
  const baseFields: Array<keyof ReportFormData> = [
    'ayuntamientoId',
    'tipoTramite',
    'numeroInforme',
    'fechaSolicitud',
    'medioSolicitud',
    'asunto',
    'antecedentesHecho',
    'fundamentosDerecho',
    'conclusiones'
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
    const stringValue = Array.isArray(rawValue)
      ? hasMeaningfulContent(rawValue)
        ? `${rawValue.filter((value) => value.trim() !== '').length} elementos`
        : ''
      : typeof rawValue === 'string'
        ? rawValue.trim()
        : '';
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
    ? `Recibida peticion mediante ${values.medioSolicitud} de fecha ${formatDisplayDate(values.fechaSolicitud)} de ${applicant} del ${values.servicio} del Area de ${values.area} del Ayuntamiento de ${values.municipio}, solicitando asistencia tecnica en materia de Proteccion de Datos.`
    : `Se emite informe en relacion con el expediente ${values.numeroSael} del Ayuntamiento de ${values.municipio}.`;

  return `${signatureCode}

Nº Informe: ${values.numeroInforme}
Nº Expediente SAEL: ${values.numeroSael}
Nº Expediente Externo: ${values.numeroExterno}
Nº Expediente RCON: ${values.numeroRcon}

ASUNTO: Informe sobre ${values.asunto}.

${introduction}

ANTECEDENTES DE HECHO:
${formatNumberedSection(values.antecedentesHecho)}

NORMATIVA:
${formatNormativaSection(values)}

FUNDAMENTOS DE DERECHO:
${formatNumberedSection(values.fundamentosDerecho)}

CONCLUSIONES:
${formatNumberedSection(values.conclusiones)}`;
}
