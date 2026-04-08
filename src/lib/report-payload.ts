import {
  buildApplicantFullName,
  buildSignatureCode,
  formatDisplayDate,
  requiresRemisionDocument,
  type ReportFormData
} from './report-model';

export interface ReportPdfPayload {
  title: string;
  signatureCode: string;
  applicant: string;
  introduction: string;
  data: ReportFormData;
}

export interface RemisionPdfPayload {
  title: string;
  destinatario: string;
  referencia: string;
  cuerpo: string;
  data: ReportFormData;
}

export function buildReportPdfPayload(data: ReportFormData): ReportPdfPayload {
  const applicant = buildApplicantFullName(data);

  return {
    title: `Informe ${data.numeroSael || data.municipio}`,
    signatureCode: buildSignatureCode(data),
    applicant,
    introduction: requiresRemisionDocument(data)
      ? `Recibida petición mediante ${data.medioSolicitud} de fecha ${formatDisplayDate(data.fechaSolicitud)} de ${applicant} del ${data.servicio} del Área de ${data.area} del Ayuntamiento de ${data.municipio}, solicitando asistencia técnica en materia de Protección de Datos.`
      : `Se emite informe en relación con el expediente ${data.numeroSael} del Ayuntamiento de ${data.municipio}.`,
    data
  };
}

export function buildRemisionPdfPayload(data: ReportFormData): RemisionPdfPayload {
  return {
    title: `Oficio ${data.numeroInforme || data.numeroSael}`,
    destinatario: data.personaRemision || data.nombreRepresentante,
    referencia: `${data.numeroSael}${data.numeroRcon ? ` / ${data.numeroRcon}` : ''}`,
    cuerpo: `Se remite el informe emitido en relación con el expediente ${data.numeroSael} del Ayuntamiento de ${data.municipio} para su conocimiento y efectos oportunos.`,
    data
  };
}
