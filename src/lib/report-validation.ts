import { z } from 'zod';
import {
  FIELD_LABELS,
  requiresRemisionDocument,
  type ReportFormData,
  type TramiteType
} from './report-model';

const signersSchema = z.object({
  delegado: z.boolean(),
  diputado: z.boolean(),
  coordinador: z.boolean()
});

export const reportFormSchema = z
  .object({
    ayuntamientoId: z.string().min(1, `${FIELD_LABELS.ayuntamientoId} es obligatorio.`),
    expedienteId: z.string(),
    tipoTramite: z.enum(['requerimiento_ctpda', 'peticion_general'] satisfies [TramiteType, TramiteType]),
    llevaOficioRemision: z.boolean(),
    numeroInforme: z.string().min(1, 'Número de informe es obligatorio.'),
    numeroSael: z.string(),
    numeroExterno: z.string(),
    numeroRcon: z.string(),
    fechaSolicitud: z
      .string()
      .min(1, 'Fecha de solicitud es obligatoria.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: 'Fecha de solicitud debe tener formato de fecha válido.'
      }),
    fechaResolucion: z.string(),
    servicio: z.string(),
    area: z.string(),
    asunto: z.string().min(5, 'Asunto debe tener al menos 5 caracteres.'),
    medioSolicitud: z.string().min(1, 'Medio de solicitud es obligatorio.'),
    municipio: z.string(),
    cif: z.string(),
    codigoDir3: z.string(),
    direccion: z.string(),
    tratamiento: z.string(),
    nombreRepresentante: z.string(),
    cargoRepresentante: z.string(),
    solicitanteNombre: z.string(),
    solicitanteApellido1: z.string(),
    solicitanteApellido2: z.string(),
    personaRemision: z.string(),
    inicialesResponsable: z.string().min(1, 'Iniciales responsable es obligatorio.'),
    inicialesRedactor: z.string().min(1, 'Iniciales redactor es obligatorio.'),
    hecho1: z.string(),
    hecho2: z.string(),
    hecho3: z.string(),
    normativa1: z.string(),
    normativa2: z.string(),
    normativa3: z.string(),
    derechos1: z.string(),
    conclusion1: z.string(),
    logoUrl: z.string(),
    firmantes: signersSchema
  })
  .superRefine((values, context) => {
    const initialsSignature = `${values.inicialesResponsable.trim()}/${values.inicialesRedactor.trim()}`;
    if (!/^[A-Z]+\/[a-z]+$/.test(initialsSignature)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inicialesResponsable'],
        message: 'Iniciales firmantes debe seguir el formato MAYUSCULAS/minusculas.'
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inicialesRedactor'],
        message: 'Iniciales firmantes debe seguir el formato MAYUSCULAS/minusculas.'
      });
    }

    if (values.tipoTramite === 'requerimiento_ctpda' && values.numeroRcon.trim() === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['numeroRcon'],
        message: 'Requerido para el CTPDA.'
      });
    }

    if (requiresRemisionDocument(values) && values.codigoDir3.trim() === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['codigoDir3'],
        message: 'Código DIR3 es obligatorio para generar oficio de remisión.'
      });
    }

    if (!values.firmantes.delegado && !values.firmantes.diputado && !values.firmantes.coordinador) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['firmantes'],
        message: 'Debes seleccionar al menos un firmante.'
      });
    }
  });

export type ReportFormSchema = z.infer<typeof reportFormSchema>;

export function getFieldErrorMap(values: ReportFormData) {
  const validation = reportFormSchema.safeParse(values);
  if (validation.success) {
    return new Map<keyof ReportFormData, string>();
  }

  const errorMap = new Map<keyof ReportFormData, string>();
  for (const issue of validation.error.issues) {
    const path = issue.path[0];
    if (typeof path === 'string' && !errorMap.has(path as keyof ReportFormData)) {
      errorMap.set(path as keyof ReportFormData, issue.message);
    }
  }

  return errorMap;
}
