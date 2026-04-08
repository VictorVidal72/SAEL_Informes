import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import RemisionPDF from './RemisionPDF';
import ReportPDF from './ReportPDF';
import {
  applyExpedienteToForm,
  buildChecklist,
  buildReportPreview,
  createEmptyReportForm,
  DB_MANAGED_FIELDS,
  FIELD_LABELS,
  mapDbDataToForm,
  requiresRemisionDocument,
  type DbManagedField,
  type ReportFormData
} from '../lib/report-model';
import {
  buildRemisionPdfPayload,
  buildReportPdfPayload
} from '../lib/report-payload';
import { reportFormSchema } from '../lib/report-validation';
import {
  fetchAyuntamientoBundle,
  fetchAyuntamientos
} from '../services/report-data.service';
import type { AyuntamientoRow, ExpedienteRow } from '../lib/supabase';

type ManualEditMap = Partial<Record<DbManagedField, boolean>>;
type PreviewMode = 'report' | 'remision' | null;

function createManualEditMap(): ManualEditMap {
  return DB_MANAGED_FIELDS.reduce<ManualEditMap>((accumulator, field) => {
    accumulator[field] = false;
    return accumulator;
  }, {});
}

function createLoadedFieldSet(values: ReportFormData): Set<DbManagedField> {
  return new Set(
    DB_MANAGED_FIELDS.filter((field) => values[field].trim() !== '')
  );
}

function ayuntamientoLabel(item: AyuntamientoRow): string {
  return [item.nombre, item.comarca].filter(Boolean).join(' · ');
}

function expedienteLabel(item: ExpedienteRow): string {
  const sael = item.num_expediente_sael || 'Sin SAEL';
  const rcon = item.num_expediente_rcon ? ` · RCON ${item.num_expediente_rcon}` : '';
  const estado = item.estado ? ` · ${item.estado}` : '';
  return `${sael}${rcon}${estado}`;
}

function Accordion({
  title,
  description,
  children,
  defaultOpen = false
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-slate-50 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-[#16324f]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          abrir
        </span>
      </summary>
      <div className="grid gap-4 px-6 py-6 md:grid-cols-2">{children}</div>
    </details>
  );
}

export default function GeneratorForm() {
  const [isClient, setIsClient] = useState(false);
  const [ayuntamientos, setAyuntamientos] = useState<AyuntamientoRow[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteRow[]>([]);
  const [manualEdits, setManualEdits] = useState<ManualEditMap>(createManualEditMap);
  const [dbLoadedFields, setDbLoadedFields] = useState<Set<DbManagedField>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoadingAyuntamientos, setIsLoadingAyuntamientos] = useState(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(null);

  const {
    control,
    register,
    reset,
    getValues,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid }
  } = useForm<ReportFormData>({
    defaultValues: createEmptyReportForm(),
    resolver: zodResolver(reportFormSchema),
    mode: 'onChange'
  });

  const values = watch();
  const reportPayload = useMemo(() => buildReportPdfPayload(values), [values]);
  const remisionPayload = useMemo(() => buildRemisionPdfPayload(values), [values]);
  const checklist = useMemo(
    () => buildChecklist(values, dbLoadedFields),
    [values, dbLoadedFields]
  );
  const canGenerate = isValid && checklist.missing.length === 0;
  const showRemisionAction = requiresRemisionDocument(values);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAyuntamientos() {
      setIsLoadingAyuntamientos(true);
      try {
        const data = await fetchAyuntamientos();
        if (!cancelled) {
          setAyuntamientos(data);
          setAlertMessage('');
        }
      } catch (error) {
        if (!cancelled) {
          setAlertMessage(error instanceof Error ? error.message : 'No se pudo cargar Ayuntamiento.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAyuntamientos(false);
        }
      }
    }

    void loadAyuntamientos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ayuntamientoId = values.ayuntamientoId;

    async function loadBundle() {
      if (!ayuntamientoId) {
        setExpedientes([]);
        setManualEdits(createManualEditMap());
        setDbLoadedFields(new Set());
        return;
      }

      setIsLoadingRelations(true);

      try {
        const bundle = await fetchAyuntamientoBundle(ayuntamientoId);
        if (cancelled) {
          return;
        }

        const nextValues = mapDbDataToForm(
          bundle.ayuntamiento,
          bundle.contactoPrincipal,
          bundle.expedientes[0] ?? null,
          getValues()
        );

        reset(nextValues);
        setExpedientes(bundle.expedientes);
        setManualEdits(createManualEditMap());
        setDbLoadedFields(createLoadedFieldSet(nextValues));
        setAlertMessage('');
        await trigger();
      } catch (error) {
        if (!cancelled) {
          setAlertMessage(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los datos relacionados.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRelations(false);
        }
      }
    }

    void loadBundle();
    return () => {
      cancelled = true;
    };
  }, [getValues, reset, trigger, values.ayuntamientoId]);

  useEffect(() => {
    const expedienteId = values.expedienteId;
    if (!expedienteId) {
      return;
    }

    const expediente = expedientes.find((item) => String(item.id) === expedienteId) ?? null;
    if (!expediente) {
      return;
    }

    const nextValues = applyExpedienteToForm(getValues(), expediente);
    reset(nextValues);
    setDbLoadedFields(createLoadedFieldSet(nextValues));
    void trigger();
  }, [expedientes, getValues, reset, trigger, values.expedienteId]);

  const filteredAyuntamientos = ayuntamientos.filter((item) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return [item.nombre, item.cif, item.comarca, item.poblacion]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalized);
  });

  function toggleManual(field: DbManagedField) {
    setManualEdits((current) => ({ ...current, [field]: !current[field] }));
  }

  function isReadonly(field: DbManagedField) {
    return dbLoadedFields.has(field) && !manualEdits[field];
  }

  function openPreview(mode: PreviewMode) {
    if (!mode || !canGenerate) {
      return;
    }

    setPreviewMode(mode);
  }

  function renderDbField(
    field: DbManagedField,
    label: string,
    options?: { type?: 'text' | 'date'; wide?: boolean }
  ) {
    return (
      <label
        key={field}
        className={options?.wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {dbLoadedFields.has(field) ? (
            <button
              type="button"
              onClick={() => toggleManual(field)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                manualEdits[field]
                  ? 'bg-[#16324f] text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {manualEdits[field] ? 'Bloquear' : 'Editar'}
            </button>
          ) : null}
        </span>
        <input
          type={options?.type ?? 'text'}
          {...register(field)}
          readOnly={isReadonly(field)}
          className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
            isReadonly(field)
              ? 'border-slate-200 bg-slate-100 text-slate-500'
              : 'border-slate-300 bg-white text-slate-900 focus:border-[#16324f] focus:ring-4 focus:ring-slate-200'
          } ${errors[field] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
        />
        {errors[field] ? (
          <p className="text-xs font-medium text-red-600">{errors[field]?.message}</p>
        ) : null}
      </label>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f4f7fb_0%,_#e5ebf3_100%)] text-slate-900">
      <div className="border-b border-[#d7dee8] bg-[#16324f] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
              Servicio de Asistencia a Entidades Locales
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[0.18em]">
              SAEL REPORTS
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Buscar Ayuntamiento</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Nombre, CIF, comarca..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Ayuntamiento</span>
                  <Controller
                    control={control}
                    name="ayuntamientoId"
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                      >
                        <option value="">Selecciona un ayuntamiento</option>
                        {filteredAyuntamientos.map((item) => (
                          <option key={item.id} value={String(item.id)}>
                            {ayuntamientoLabel(item)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.ayuntamientoId ? (
                    <p className="text-xs font-medium text-red-600">
                      {errors.ayuntamientoId.message}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Tipo de trámite</span>
                  <select
                    {...register('tipoTramite')}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                  >
                    <option value="peticion_general">Petición General</option>
                    <option value="requerimiento_ctpda">Requerimiento CTPDA</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="flex cursor-pointer items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    {...register('llevaOficioRemision')}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-[#16324f] focus:ring-[#16324f]"
                  />
                  <span>
                    <span className="block text-base font-semibold text-[#16324f]">
                      ¿Lleva oficio de remisión?
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Condiciona los campos extra y la generación del PDF de oficio.
                    </span>
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Expediente asociado</span>
                  <Controller
                    control={control}
                    name="expedienteId"
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={expedientes.length === 0}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                      >
                        <option value="">Selecciona un expediente</option>
                        {expedientes.map((item) => (
                          <option key={item.id} value={String(item.id)}>
                            {expedienteLabel(item)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {isLoadingAyuntamientos
                    ? 'Cargando ayuntamientos...'
                    : `${filteredAyuntamientos.length} ayuntamientos visibles`}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {isLoadingRelations
                    ? 'Cargando relaciones...'
                    : `${expedientes.length} expedientes asociados`}
                </span>
              </div>

              {alertMessage ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {alertMessage}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
                  Datos recuperados de la BD
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                  {checklist.recovered.length > 0 ? (
                    checklist.recovered.map((item) => (
                      <li key={item.field} className="rounded-xl bg-white/80 px-3 py-2">
                        {item.label}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl bg-white/80 px-3 py-2">
                      Aún no hay datos recuperados.
                    </li>
                  )}
                </ul>
              </section>

              <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                  Datos faltantes para respuesta válida
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-amber-900">
                  {checklist.missing.length > 0 ? (
                    checklist.missing.map((item) => (
                      <li key={item.field} className="rounded-xl bg-white/80 px-3 py-2">
                        {item.label}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl bg-white/80 px-3 py-2">
                      Todo lo obligatorio está completo.
                    </li>
                  )}
                </ul>
              </section>
            </div>

            <Accordion
              title="Entidad y Representante"
              description="Datos relacionales de Ayuntamiento y Contacto principal."
              defaultOpen
            >
              {renderDbField('municipio', FIELD_LABELS.municipio)}
              {renderDbField('cif', FIELD_LABELS.cif)}
              {renderDbField('codigoDir3', FIELD_LABELS.codigoDir3)}
              {renderDbField('direccion', FIELD_LABELS.direccion, { wide: true })}
              {renderDbField('tratamiento', FIELD_LABELS.tratamiento)}
              {renderDbField('nombreRepresentante', FIELD_LABELS.nombreRepresentante)}
              {renderDbField('cargoRepresentante', FIELD_LABELS.cargoRepresentante, {
                wide: true
              })}
            </Accordion>

            <Accordion
              title="Expedientes y Firmas"
              description="Variables clave de numeración y firma."
            >
              {renderDbField('numeroSael', FIELD_LABELS.numeroSael)}
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.numeroExterno}</span>
                <input
                  {...register('numeroExterno')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
              </label>
              {renderDbField('numeroRcon', FIELD_LABELS.numeroRcon)}
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.numeroInforme}</span>
                <input
                  {...register('numeroInforme')}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
                    errors.numeroInforme
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-[#16324f] focus:ring-4 focus:ring-slate-200'
                  }`}
                />
                {errors.numeroInforme ? (
                  <p className="text-xs font-medium text-red-600">
                    {errors.numeroInforme.message}
                  </p>
                ) : null}
              </label>
              {renderDbField('fechaSolicitud', FIELD_LABELS.fechaSolicitud, { type: 'date' })}
              {renderDbField('fechaResolucion', FIELD_LABELS.fechaResolucion, {
                type: 'date'
              })}
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.inicialesResponsable}</span>
                <input
                  {...register('inicialesResponsable')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
                {errors.inicialesResponsable ? (
                  <p className="text-xs font-medium text-red-600">
                    {errors.inicialesResponsable.message}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.inicialesRedactor}</span>
                <input
                  {...register('inicialesRedactor')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
                {errors.inicialesRedactor ? (
                  <p className="text-xs font-medium text-red-600">
                    {errors.inicialesRedactor.message}
                  </p>
                ) : null}
              </label>
            </Accordion>

            {requiresRemisionDocument(values) ? (
              <Accordion
                title="Oficio de Remisión"
                description="Campos requeridos cuando el trámite exige remisión."
                defaultOpen
              >
                {renderDbField('personaRemision', FIELD_LABELS.personaRemision)}
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.medioSolicitud}</span>
                  <input
                    {...register('medioSolicitud')}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                  />
                </label>
                {renderDbField('solicitanteNombre', FIELD_LABELS.solicitanteNombre)}
                {renderDbField('solicitanteApellido1', FIELD_LABELS.solicitanteApellido1)}
                {renderDbField('solicitanteApellido2', FIELD_LABELS.solicitanteApellido2)}
              </Accordion>
            ) : null}

            <Accordion
              title="Contenido y Firmantes"
              description="Narrativa del informe y selección de firmantes."
            >
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.servicio}</span>
                <input
                  {...register('servicio')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.area}</span>
                <input
                  {...register('area')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{FIELD_LABELS.asunto}</span>
                <input
                  {...register('asunto')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Firmantes incluidos</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(['delegado', 'diputado', 'coordinador'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 text-sm text-slate-700">
                      <Controller
                        control={control}
                        name={`firmantes.${key}`}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        )}
                      />
                      {key === 'delegado'
                        ? 'Delegado'
                        : key === 'diputado'
                          ? 'Diputado'
                          : 'Coordinador'}
                    </label>
                  ))}
                </div>
              </div>
              {(['hecho1', 'hecho2', 'hecho3', 'normativa1', 'normativa2', 'normativa3', 'derechos1', 'conclusion1'] as const).map((field) => (
                <label
                  key={field}
                  className={
                    field === 'hecho3' ||
                    field === 'normativa3' ||
                    field === 'derechos1' ||
                    field === 'conclusion1'
                      ? 'space-y-2 md:col-span-2'
                      : 'space-y-2'
                  }
                >
                  <span className="text-sm font-medium text-slate-700">
                    {FIELD_LABELS[field]}
                  </span>
                  <textarea
                    {...register(field)}
                    className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
                  />
                </label>
              ))}
            </Accordion>
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-[#16324f] p-6 text-white shadow-2xl shadow-slate-300/30">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                Paso 6 y 7
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Panel de acciones</h2>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                disabled={!canGenerate}
                onClick={() => openPreview('report')}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#16324f] transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Generar Informe DPD (PDF)
              </button>

              {showRemisionAction ? (
                <button
                  type="button"
                  disabled={!canGenerate}
                  onClick={() => openPreview('remision')}
                  className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-[#16324f] transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  Generar Oficio de Remisión (PDF)
                </button>
              ) : null}
            </div>

            <textarea
              readOnly
              value={buildReportPreview(values)}
              className="mt-6 min-h-[980px] w-full rounded-3xl border border-white/10 bg-[#0f2438] p-5 font-mono text-sm leading-7 text-slate-100 shadow-inner outline-none"
            />
          </section>
        </div>
      </div>

      {previewMode && isClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Vista previa PDF
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#16324f]">
                  {previewMode === 'report' ? 'Informe DPD' : 'Oficio de Remisión'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <PDFDownloadLink
                  document={
                    previewMode === 'report' ? (
                      <ReportPDF payload={reportPayload} />
                    ) : (
                      <RemisionPDF payload={remisionPayload} />
                    )
                  }
                  fileName={`${previewMode}-${values.municipio || 'shaluqa'}.pdf`}
                  className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]"
                >
                  {({ loading }) => (loading ? 'Preparando PDF...' : 'Descargar PDF')}
                </PDFDownloadLink>
                <button
                  type="button"
                  onClick={() => setPreviewMode(null)}
                  className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100">
              <PDFViewer width="100%" height="100%" showToolbar>
                {previewMode === 'report' ? (
                  <ReportPDF payload={reportPayload} />
                ) : (
                  <RemisionPDF payload={remisionPayload} />
                )}
              </PDFViewer>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
