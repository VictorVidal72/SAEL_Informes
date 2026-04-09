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

const nonEmptyStringArraySchema = (label: string) =>
  z
    .array(z.string().trim())
    .min(1, `${label} debe tener al menos un elemento.`)
    .refine((items) => items.some((item) => item.length > 0), {
      message: `${label} debe tener al menos un elemento rellenado.`
    });

const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    message: 'Peticionario correo debe tener un email valido.'
  });

export const reportFormSchema = z
  .object({
    ayuntamientoId: z.string().min(1, `${FIELD_LABELS.ayuntamientoId} es obligatorio.`),
    expedienteId: z.string(),
    tipoTramite: z.enum(
      ['requerimiento_ctpda', 'peticion_general'] satisfies [TramiteType, TramiteType]
    ),
    llevaOficioRemision: z.boolean(),
    numeroInforme: z.string().min(1, 'Numero de informe es obligatorio.'),
    numeroSael: z.string(),
    numeroExterno: z.string(),
    numeroRcon: z.string(),
    fechaSolicitud: z
      .string()
      .min(1, 'Fecha de solicitud es obligatoria.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: 'Fecha de solicitud debe tener formato de fecha valido.'
      }),
    fechaResolucion: z.string(),
    plazo_respuesta: z.string(),
    instrucciones_contestar: z.string(),
    peticionario_nombre: z.string(),
    peticionario_apellidos: z.string(),
    peticionario_correo: optionalEmailSchema,
    peticionario_telefono: z.string(),
    peticionario_puesto: z.string(),
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
    antecedentesHecho: nonEmptyStringArraySchema('Antecedentes de hecho'),
    normativaObligatoria: z.string().min(1, 'Normativa obligatoria es obligatoria.'),
    normativasOpcionales: z.array(z.string()),
    normativaAdicional: z.string(),
    fundamentosDerecho: nonEmptyStringArraySchema('Fundamentos de derecho'),
    conclusiones: nonEmptyStringArraySchema('Conclusiones'),
    logoUrl: z.string(),
    firmantes: signersSchema
  })
  .superRefine((values, context) => {
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
        message: 'Codigo DIR3 es obligatorio para generar oficio de remision.'
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
