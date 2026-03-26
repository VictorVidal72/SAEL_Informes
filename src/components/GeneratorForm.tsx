import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { useEffect, useState, type ReactNode } from 'react';
import ReportPDF from './ReportPDF';
import {
  applyExpedienteToForm,
  buildReportPreview,
  buildSignatureCode,
  createEmptyReportForm,
  DB_MANAGED_FIELDS,
  mapDbDataToForm,
  validateReportForm,
  type DbManagedField,
  type ReportFormData
} from '../lib/report-model';
import {
  supabase,
  type AyuntamientoRow,
  type ContactoRow,
  type ExpedienteRow
} from '../lib/supabase';

type ManualEditMap = Partial<Record<DbManagedField, boolean>>;

const ENTITY_FIELDS: Array<{ key: DbManagedField; label: string; wide?: boolean }> = [
  { key: 'municipio', label: 'Municipio' },
  { key: 'cif', label: 'CIF' },
  { key: 'direccion', label: 'Dirección', wide: true },
  { key: 'tratamiento', label: 'Tratamiento' },
  { key: 'nombreRepresentante', label: 'Nombre del Alcalde / Representante' },
  { key: 'cargoRepresentante', label: 'Cargo', wide: true }
];

const EXPEDIENTE_FIELDS: Array<{
  key: 'numeroSael' | 'numeroExterno' | 'numeroRcon' | 'numeroInforme' | 'fechaSolicitud' | 'fechaResolucion';
  label: string;
  type?: 'text' | 'date';
  dbManaged?: boolean;
}> = [
  { key: 'numeroSael', label: 'Número SAEL', dbManaged: true },
  { key: 'numeroExterno', label: 'Número Externo' },
  { key: 'numeroRcon', label: 'Número RCON', dbManaged: true },
  { key: 'numeroInforme', label: 'Número Informe' },
  { key: 'fechaSolicitud', label: 'Fecha Solicitud', type: 'date', dbManaged: true },
  { key: 'fechaResolucion', label: 'Fecha Resolución', type: 'date', dbManaged: true }
];

function isActiveStatus(status: string | null): boolean {
  const normalized = status?.trim().toLowerCase() ?? '';
  return ['activo', 'activa', 'abierto', 'en curso', 'en tramitacion', 'en tramitación'].includes(
    normalized
  );
}

function emptyManualEdits(): ManualEditMap {
  return DB_MANAGED_FIELDS.reduce<ManualEditMap>((acc, field) => {
    acc[field] = false;
    return acc;
  }, {});
}

function ayuntamientoLabel(item: AyuntamientoRow): string {
  return [item.nombre, item.comarca].filter(Boolean).join(' · ');
}

function expedienteLabel(item: ExpedienteRow): string {
  const sael = item.num_expediente_sael || 'Sin SAEL';
  const rcon = item.num_expediente_rcon ? ` · RCON ${item.num_expediente_rcon}` : '';
  const status = item.estado ? ` · ${item.estado}` : '';
  return `${sael}${rcon}${status}`;
}

function Accordion({
  title,
  description,
  children,
  defaultOpen = false
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
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
  const [formData, setFormData] = useState<ReportFormData>(createEmptyReportForm);
  const [manualEdits, setManualEdits] = useState<ManualEditMap>(emptyManualEdits);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingAyuntamientos, setIsLoadingAyuntamientos] = useState(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [missingFields, setMissingFields] = useState<Array<keyof ReportFormData>>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAyuntamientos() {
      setIsLoadingAyuntamientos(true);
      const { data, error } = await supabase.from('Ayuntamiento').select('*').order('nombre', { ascending: true });
      if (cancelled) return;
      setAyuntamientos(error ? [] : ((data as AyuntamientoRow[]) ?? []));
      setAlertMessage(error ? 'No se pudo cargar la tabla Ayuntamiento.' : '');
      setIsLoadingAyuntamientos(false);
    }

    void loadAyuntamientos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRelations() {
      if (!formData.ayuntamientoId) {
        setExpedientes([]);
        setManualEdits(emptyManualEdits());
        return;
      }

      const ayuntamiento = ayuntamientos.find((item) => String(item.id) === formData.ayuntamientoId);
      if (!ayuntamiento) return;

      setIsLoadingRelations(true);
      const [contactosResponse, expedientesResponse] = await Promise.all([
        supabase.from('Contacto').select('*').eq('ayuntamiento_id', ayuntamiento.id).order('es_principal', { ascending: false }).order('created_at', { ascending: true }),
        supabase.from('Expediente').select('*').eq('ayuntamiento_id', ayuntamiento.id).order('created_at', { ascending: false })
      ]);

      if (cancelled) return;
      if (contactosResponse.error || expedientesResponse.error) {
        setAlertMessage('No se pudieron cargar Contacto y Expediente del ayuntamiento seleccionado.');
        setIsLoadingRelations(false);
        return;
      }

      const contactos = (contactosResponse.data as ContactoRow[]) ?? [];
      const contactoPrincipal = contactos.find((item) => item.es_principal) ?? contactos.at(0) ?? null;
      const asociados = ((expedientesResponse.data as ExpedienteRow[]) ?? []).sort((a, b) => {
        const left = isActiveStatus(a.estado) ? 0 : 1;
        const right = isActiveStatus(b.estado) ? 0 : 1;
        return left - right;
      });
      const expedienteInicial = asociados.at(0) ?? null;

      setExpedientes(asociados);
      setManualEdits(emptyManualEdits());
      setFormData((current) => mapDbDataToForm(ayuntamiento, contactoPrincipal, expedienteInicial, current));
      setIsLoadingRelations(false);
      setAlertMessage('');
    }

    void loadRelations();
    return () => {
      cancelled = true;
    };
  }, [ayuntamientos, formData.ayuntamientoId]);

  useEffect(() => {
    if (!formData.expedienteId) return;
    const expediente = expedientes.find((item) => String(item.id) === formData.expedienteId) ?? null;
    if (!expediente) return;
    setFormData((current) => applyExpedienteToForm(current, expediente));
  }, [expedientes, formData.expedienteId]);

  const filteredAyuntamientos = ayuntamientos.filter((item) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return true;
    return [item.nombre, item.cif, item.comarca, item.poblacion].filter(Boolean).join(' ').toLowerCase().includes(normalized);
  });

  const previewText = buildReportPreview(formData);
  const signatureCode = buildSignatureCode(formData);
  const pdfDocument = <ReportPDF data={formData} />;

  function updateField<K extends keyof ReportFormData>(field: K, value: ReportFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setMissingFields((current) => current.filter((item) => item !== field));
  }

  function toggleManual(field: DbManagedField) {
    setManualEdits((current) => ({ ...current, [field]: !current[field] }));
  }

  function fieldError(field: keyof ReportFormData) {
    return missingFields.includes(field) ? 'Este campo es obligatorio.' : '';
  }

  function validateAndOpen() {
    const missing = validateReportForm(formData);
    setMissingFields(missing);
    if (missing.length > 0) {
      setAlertMessage('Faltan campos obligatorios antes de generar el informe.');
      return;
    }
    setAlertMessage('');
    setIsPreviewOpen(true);
  }

  function renderInput(
    key: keyof ReportFormData,
    label: string,
    options?: { type?: 'text' | 'date'; dbManaged?: boolean; wide?: boolean }
  ) {
    const dbField = options?.dbManaged ? (key as DbManagedField) : null;
    const readOnly = dbField ? !manualEdits[dbField] : false;

    return (
      <label key={String(key)} className={options?.wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {dbField ? (
            <button
              type="button"
              onClick={() => toggleManual(dbField)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                manualEdits[dbField]
                  ? 'bg-[#16324f] text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {manualEdits[dbField] ? 'Bloquear' : 'Editar'}
            </button>
          ) : null}
        </span>
        <input
          type={options?.type ?? 'text'}
          value={String(formData[key] ?? '')}
          readOnly={readOnly}
          onChange={(event) => updateField(key, event.target.value as ReportFormData[typeof key])}
          className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
            readOnly
              ? 'border-slate-200 bg-slate-100 text-slate-500'
              : 'border-slate-300 bg-white text-slate-900 focus:border-[#16324f] focus:ring-4 focus:ring-slate-200'
          } ${fieldError(key) ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
        />
        {fieldError(key) ? <p className="text-xs font-medium text-red-600">{fieldError(key)}</p> : null}
      </label>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f4f7fb_0%,_#e5ebf3_100%)] text-slate-900">
      <div className="border-b border-[#d7dee8] bg-[#16324f] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Servicio de Asistencia a Entidades Locales</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[0.18em]">SHALUQA REPORTS</h1>
          </div>
          <button type="button" onClick={validateAndOpen} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#16324f] shadow-md transition hover:bg-slate-100">
            Generar Informe PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <label className="flex cursor-pointer items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <input type="checkbox" checked={formData.llevaOficioRemision} onChange={(event) => updateField('llevaOficioRemision', event.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-[#16324f] focus:ring-[#16324f]" />
              <span>
                <span className="block text-base font-semibold text-[#16324f]">¿Lleva oficio de remisión?</span>
                <span className="mt-1 block text-sm text-slate-500">Actívalo para mostrar los campos extra del oficio y validarlos antes de generar el informe.</span>
              </span>
            </label>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
                {renderInput('logoUrl', 'Logo URL')}
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Ayuntamiento</span>
                  <select value={formData.ayuntamientoId} onChange={(event) => updateField('ayuntamientoId', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200">
                    <option value="">Selecciona un ayuntamiento</option>
                    {filteredAyuntamientos.map((item) => <option key={item.id} value={String(item.id)}>{ayuntamientoLabel(item)}</option>)}
                  </select>
                  {fieldError('ayuntamientoId') ? <p className="text-xs font-medium text-red-600">{fieldError('ayuntamientoId')}</p> : null}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Buscar</span>
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nombre, CIF, comarca..." className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200" />
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-700">Expediente asociado</span>
                <select
                  value={formData.expedienteId}
                  onChange={(event) => updateField('expedienteId', event.target.value)}
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
              </label>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">{isLoadingAyuntamientos ? 'Cargando ayuntamientos...' : `${filteredAyuntamientos.length} ayuntamientos visibles`}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{isLoadingRelations ? 'Cargando relaciones...' : `${expedientes.length} expedientes asociados`}</span>
                <span className="rounded-full bg-[#16324f] px-3 py-1 text-white">Firma: {signatureCode || 'Pendiente'}</span>
              </div>
              {alertMessage ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{alertMessage}</div> : null}
            </section>

            <Accordion title="Entidad y Representante" description="Datos relacionales con bloqueo por campo y edición puntual." defaultOpen>
              {ENTITY_FIELDS.map((field) => renderInput(field.key, field.label, { dbManaged: true, wide: field.wide }))}
            </Accordion>

            <Accordion title="Expedientes y Firmas" description="Numeración del expediente y composición de firmas del informe.">
              {EXPEDIENTE_FIELDS.map((field) => renderInput(field.key, field.label, { type: field.type, dbManaged: field.dbManaged }))}
              {renderInput('inicialesResponsable', 'Iniciales Responsable')}
              {renderInput('inicialesRedactor', 'Iniciales Redactor')}
            </Accordion>

            {formData.llevaOficioRemision ? (
              <Accordion title="Oficio de Remisión" description="Campos condicionados por la regla de negocio del oficio." defaultOpen>
                {renderInput('personaRemision', 'Persona de remisión', { dbManaged: true })}
                {renderInput('medioSolicitud', 'Medio de solicitud')}
                {renderInput('solicitanteNombre', 'Solicitante nombre', { dbManaged: true })}
                {renderInput('solicitanteApellido1', 'Solicitante apellido 1', { dbManaged: true })}
                {renderInput('solicitanteApellido2', 'Solicitante apellido 2', { dbManaged: true })}
              </Accordion>
            ) : null}

            <Accordion title="Contenido y Firmantes" description="Narrativa del informe y pie adaptativo según los firmantes seleccionados.">
              {renderInput('servicio', 'Servicio')}
              {renderInput('area', 'Área')}
              {renderInput('asunto', 'Asunto', { wide: true })}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Firmantes incluidos</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(['delegado', 'diputado', 'coordinador'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.firmantes[key]} onChange={(event) => updateField('firmantes', { ...formData.firmantes, [key]: event.target.checked })} />
                      {key === 'delegado' ? 'Delegado' : key === 'diputado' ? 'Diputado' : 'Coordinador'}
                    </label>
                  ))}
                </div>
              </div>
              {(['hecho1', 'hecho2', 'hecho3', 'normativa1', 'normativa2', 'normativa3', 'derechos1', 'conclusion1'] as const).map((key) => (
                <label key={key} className={key === 'derechos1' || key === 'conclusion1' || key === 'hecho3' || key === 'normativa3' ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
                  <span className="text-sm font-medium text-slate-700">{key}</span>
                  <textarea value={formData[key]} onChange={(event) => updateField(key, event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200" />
                </label>
              ))}
            </Accordion>
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-[#16324f] p-6 text-white shadow-2xl shadow-slate-300/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Previsualización</p>
                <h2 className="mt-2 text-2xl font-semibold">Borrador del informe</h2>
              </div>
              {isClient ? <PDFDownloadLink document={pdfDocument} fileName={`informe-${formData.municipio || 'shaluqa'}.pdf`} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#16324f] transition hover:bg-slate-100">{({ loading }) => loading ? 'Preparando PDF...' : 'Descargar PDF'}</PDFDownloadLink> : null}
            </div>
            <textarea readOnly value={previewText} className="mt-6 min-h-[980px] w-full rounded-3xl border border-white/10 bg-[#0f2438] p-5 font-mono text-sm leading-7 text-slate-100 shadow-inner outline-none" />
          </section>
        </div>
      </div>

      {isPreviewOpen && isClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Vista previa PDF</p>
                <h2 className="mt-1 text-xl font-semibold text-[#16324f]">Informe de {formData.municipio || 'Ayuntamiento'}</h2>
              </div>
              <div className="flex items-center gap-3">
                <PDFDownloadLink document={pdfDocument} fileName={`informe-${formData.municipio || 'shaluqa'}.pdf`} className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]">{({ loading }) => loading ? 'Preparando PDF...' : 'Descargar PDF'}</PDFDownloadLink>
                <button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">Cerrar</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <PDFViewer width="100%" height="100%" showToolbar>{pdfDocument}</PDFViewer>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
