import { useEffect, useMemo, useState } from 'react';
import type {
  AyuntamientoRow,
  ContactoRow,
  ExpedienteRow,
  NormativaRow
} from '../../lib/supabase';
import {
  createAyuntamiento,
  createContacto,
  createExpediente,
  deleteAyuntamiento,
  deleteContacto,
  deleteExpediente,
  fetchAyuntamientosAdmin,
  fetchContactosAdmin,
  fetchExpedientesAdmin,
  updateAyuntamiento,
  updateContacto,
  updateExpediente,
  type AyuntamientoInput,
  type ContactoInput,
  type ExpedienteInput
} from '../../services/admin-db.service';
import {
  createNormativa,
  deleteNormativa,
  fetchNormativas,
  updateNormativa,
  type NormativaInput
} from '../../services/admin-normativa.service';
import {
  deleteStorageFile,
  fetchStorageFiles,
  type StorageFileItem
} from '../../services/admin-storage.service';

type AdminTabId =
  | 'ayuntamientos'
  | 'contactos'
  | 'expedientes'
  | 'normativas'
  | 'storage';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'date';
type FormValue = string | boolean;
type GenericFormState = Record<string, FormValue>;
type NormativaFormState = NormativaInput;

interface FormFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  wide?: boolean;
  options?: Array<{ label: string; value: string }>;
}

const ADMIN_TABS: Array<{ id: AdminTabId; label: string; description: string }> = [
  {
    id: 'ayuntamientos',
    label: 'Ayuntamientos',
    description: 'Gestion centralizada de entidades locales.'
  },
  {
    id: 'contactos',
    label: 'Contactos',
    description: 'Responsables, cargos y datos de contacto.'
  },
  {
    id: 'expedientes',
    label: 'Expedientes',
    description: 'Seguimiento de solicitudes y estados.'
  },
  {
    id: 'normativas',
    label: 'Normativas',
    description: 'CRUD completo de textos legales y categorias.'
  },
  {
    id: 'storage',
    label: 'Storage (Archivos)',
    description: 'Visor y gestion del bucket de PDFs.'
  }
];

const EMPTY_NORMATIVA_FORM: NormativaFormState = {
  titulo: '',
  texto_legal: '',
  categoria: 'General',
  es_obligatoria: false
};

const EMPTY_AYUNTAMIENTO_FORM: AyuntamientoInput = {
  nombre: '',
  cif: '',
  comarca: '',
  codigo_postal: '',
  poblacion: '',
  direccion_sede: '',
  web_dominio: '',
  email_generico: '',
  gentilicio: '',
  codigo_dir3: ''
};

const EMPTY_CONTACTO_FORM: ContactoInput = {
  ayuntamiento_id: '',
  nombre_completo: '',
  cargo: '',
  partido_politico: '',
  email: '',
  telefono: '',
  tratamiento: '',
  es_principal: false
};

const EMPTY_EXPEDIENTE_FORM: ExpedienteInput = {
  ayuntamiento_id: '',
  num_expediente_sael: '',
  num_expediente_rcon: '',
  fecha_solicitud: '',
  fecha_resolucion: '',
  estado: 'En proceso',
  num_informe: '',
  num_expediente_externo: '',
  asunto: '',
  tipo_procedimiento: 'Peticion general',
  medio_solicitud: ''
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('es-ES');
}

function formatSize(value: number | null) {
  if (!value || value <= 0) {
    return 'N/D';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function NormativaModal({
  mode,
  values,
  onChange,
  onClose,
  onSubmit,
  isSaving
}: {
  mode: 'create' | 'edit';
  values: NormativaFormState;
  onChange: (next: NormativaFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Normativa
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              {mode === 'create' ? 'Añadir Nueva Normativa' : 'Editar Normativa'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-6 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Titulo</span>
            <input
              value={values.titulo}
              onChange={(event) => onChange({ ...values, titulo: event.target.value })}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <input
              value={values.categoria}
              onChange={(event) => onChange({ ...values, categoria: event.target.value })}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={values.es_obligatoria}
              onChange={(event) =>
                onChange({ ...values, es_obligatoria: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-[#16324f] focus:ring-[#16324f]"
            />
            <span className="text-sm font-medium text-slate-700">Es obligatoria</span>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Texto legal</span>
            <textarea
              value={values.texto_legal}
              onChange={(event) => onChange({ ...values, texto_legal: event.target.value })}
              className="min-h-48 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || values.titulo.trim() === ''}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear Normativa' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyTableState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      No hay {label} disponibles.
    </div>
  );
}

function CrudModal({
  title,
  subtitle,
  fields,
  values,
  onChange,
  onClose,
  onSubmit,
  isSaving
}: {
  title: string;
  subtitle: string;
  fields: FormFieldDefinition[];
  values: GenericFormState;
  onChange: (key: string, value: FormValue) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}) {
  const isDisabled =
    isSaving ||
    fields.some(
      (field) =>
        field.required && String(values[field.key] ?? '').trim() === ''
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {subtitle}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-6 md:grid-cols-2">
          {fields.map((field) => {
            const currentValue = values[field.key];
            const commonClassName =
              'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#16324f] focus:ring-4 focus:ring-slate-200';

            if (field.type === 'checkbox') {
              return (
                <label
                  key={field.key}
                  className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 ${
                    field.wide ? 'md:col-span-2' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(currentValue)}
                    onChange={(event) => onChange(field.key, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#16324f] focus:ring-[#16324f]"
                  />
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                </label>
              );
            }

            return (
              <label
                key={field.key}
                className={`space-y-2 ${field.wide ? 'md:col-span-2' : ''}`}
              >
                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={String(currentValue ?? '')}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    className={`min-h-40 ${commonClassName}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={String(currentValue ?? '')}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    className={commonClassName}
                  >
                    <option value="">Selecciona una opcion</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                          ? 'date'
                          : 'text'
                    }
                    value={String(currentValue ?? '')}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    className={commonClassName}
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isDisabled}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTabId>('ayuntamientos');
  const [toast, setToast] = useState<ToastState | null>(null);

  const [ayuntamientos, setAyuntamientos] = useState<AyuntamientoRow[]>([]);
  const [contactos, setContactos] = useState<ContactoRow[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteRow[]>([]);
  const [normativas, setNormativas] = useState<NormativaRow[]>([]);
  const [isLoadingAyuntamientos, setIsLoadingAyuntamientos] = useState(true);
  const [isLoadingContactos, setIsLoadingContactos] = useState(true);
  const [isLoadingExpedientes, setIsLoadingExpedientes] = useState(true);
  const [isLoadingNormativas, setIsLoadingNormativas] = useState(true);
  const [isSavingAyuntamiento, setIsSavingAyuntamiento] = useState(false);
  const [isSavingContacto, setIsSavingContacto] = useState(false);
  const [isSavingExpediente, setIsSavingExpediente] = useState(false);
  const [isSavingNormativa, setIsSavingNormativa] = useState(false);
  const [ayuntamientoModalMode, setAyuntamientoModalMode] = useState<'create' | 'edit' | null>(null);
  const [contactoModalMode, setContactoModalMode] = useState<'create' | 'edit' | null>(null);
  const [expedienteModalMode, setExpedienteModalMode] = useState<'create' | 'edit' | null>(null);
  const [normativaModalMode, setNormativaModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedAyuntamientoId, setSelectedAyuntamientoId] = useState<string | null>(null);
  const [selectedContactoId, setSelectedContactoId] = useState<string | null>(null);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [selectedNormativaId, setSelectedNormativaId] = useState<string | null>(null);
  const [ayuntamientoForm, setAyuntamientoForm] = useState<AyuntamientoInput>(EMPTY_AYUNTAMIENTO_FORM);
  const [contactoForm, setContactoForm] = useState<ContactoInput>(EMPTY_CONTACTO_FORM);
  const [expedienteForm, setExpedienteForm] = useState<ExpedienteInput>(EMPTY_EXPEDIENTE_FORM);
  const [normativaForm, setNormativaForm] = useState<NormativaFormState>(EMPTY_NORMATIVA_FORM);

  const [storageFiles, setStorageFiles] = useState<StorageFileItem[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isDeletingStoragePath, setIsDeletingStoragePath] = useState<string | null>(null);

  const activeTabMeta = useMemo(
    () => ADMIN_TABS.find((tab) => tab.id === activeTab) ?? ADMIN_TABS[0],
    [activeTab]
  );

  const ayuntamientoOptions = useMemo(
    () =>
      ayuntamientos.map((item) => ({
        label: item.nombre,
        value: item.id
      })),
    [ayuntamientos]
  );

  const ayuntamientoNameById = useMemo(
    () => new Map(ayuntamientos.map((item) => [item.id, item.nombre])),
    [ayuntamientos]
  );

  const ayuntamientoFields: FormFieldDefinition[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'cif', label: 'CIF', type: 'text' },
    { key: 'comarca', label: 'Comarca', type: 'text' },
    { key: 'codigo_postal', label: 'Codigo postal', type: 'text' },
    { key: 'poblacion', label: 'Poblacion', type: 'number' },
    { key: 'direccion_sede', label: 'Direccion sede', type: 'textarea', wide: true },
    { key: 'web_dominio', label: 'Web dominio', type: 'text' },
    { key: 'email_generico', label: 'Email generico', type: 'text' },
    { key: 'gentilicio', label: 'Gentilicio', type: 'text' },
    { key: 'codigo_dir3', label: 'Codigo DIR3', type: 'text' }
  ];

  const contactoFields: FormFieldDefinition[] = [
    {
      key: 'ayuntamiento_id',
      label: 'Ayuntamiento',
      type: 'select',
      required: true,
      options: ayuntamientoOptions
    },
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text' },
    { key: 'partido_politico', label: 'Partido politico', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'telefono', label: 'Telefono', type: 'text' },
    { key: 'tratamiento', label: 'Tratamiento', type: 'text' },
    { key: 'es_principal', label: 'Es principal', type: 'checkbox', wide: true }
  ];

  const expedienteFields: FormFieldDefinition[] = [
    {
      key: 'ayuntamiento_id',
      label: 'Ayuntamiento',
      type: 'select',
      required: true,
      options: ayuntamientoOptions
    },
    { key: 'num_expediente_sael', label: 'Numero SAEL', type: 'text' },
    { key: 'num_expediente_rcon', label: 'Numero RCON', type: 'text' },
    { key: 'fecha_solicitud', label: 'Fecha solicitud', type: 'date' },
    { key: 'fecha_resolucion', label: 'Fecha resolucion', type: 'date' },
    { key: 'estado', label: 'Estado', type: 'text' },
    { key: 'num_informe', label: 'Numero informe', type: 'text' },
    { key: 'num_expediente_externo', label: 'Numero externo', type: 'text' },
    { key: 'tipo_procedimiento', label: 'Tipo procedimiento', type: 'text' },
    { key: 'medio_solicitud', label: 'Medio solicitud', type: 'text' },
    { key: 'asunto', label: 'Asunto', type: 'textarea', wide: true }
  ];

  useEffect(() => {
    void Promise.all([
      loadAyuntamientos(),
      loadContactos(),
      loadExpedientes(),
      loadNormativas(),
      loadStorageFiles()
    ]);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function loadAyuntamientos() {
    setIsLoadingAyuntamientos(true);
    try {
      const data = await fetchAyuntamientosAdmin();
      setAyuntamientos(data);
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudieron cargar los ayuntamientos.'
      });
    } finally {
      setIsLoadingAyuntamientos(false);
    }
  }

  async function loadContactos() {
    setIsLoadingContactos(true);
    try {
      const data = await fetchContactosAdmin();
      setContactos(data);
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudieron cargar los contactos.'
      });
    } finally {
      setIsLoadingContactos(false);
    }
  }

  async function loadExpedientes() {
    setIsLoadingExpedientes(true);
    try {
      const data = await fetchExpedientesAdmin();
      setExpedientes(data);
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudieron cargar los expedientes.'
      });
    } finally {
      setIsLoadingExpedientes(false);
    }
  }

  async function loadNormativas() {
    setIsLoadingNormativas(true);
    try {
      const data = await fetchNormativas();
      setNormativas(data);
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudieron cargar las normativas.'
      });
    } finally {
      setIsLoadingNormativas(false);
    }
  }

  async function loadStorageFiles() {
    setIsLoadingStorage(true);
    try {
      const data = await fetchStorageFiles();
      setStorageFiles(data);
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudieron cargar los archivos del bucket.'
      });
    } finally {
      setIsLoadingStorage(false);
    }
  }

  function openCreateNormativaModal() {
    setSelectedNormativaId(null);
    setNormativaForm(EMPTY_NORMATIVA_FORM);
    setNormativaModalMode('create');
  }

  function openCreateAyuntamientoModal() {
    setSelectedAyuntamientoId(null);
    setAyuntamientoForm(EMPTY_AYUNTAMIENTO_FORM);
    setAyuntamientoModalMode('create');
  }

  function openEditAyuntamientoModal(ayuntamiento: AyuntamientoRow) {
    setSelectedAyuntamientoId(ayuntamiento.id);
    setAyuntamientoForm({
      nombre: ayuntamiento.nombre,
      cif: ayuntamiento.cif ?? '',
      comarca: ayuntamiento.comarca ?? '',
      codigo_postal: ayuntamiento.codigo_postal ?? '',
      poblacion: ayuntamiento.poblacion?.toString() ?? '',
      direccion_sede: ayuntamiento.direccion_sede ?? '',
      web_dominio: ayuntamiento.web_dominio ?? '',
      email_generico: ayuntamiento.email_generico ?? '',
      gentilicio: ayuntamiento.gentilicio ?? '',
      codigo_dir3: ayuntamiento.codigo_dir3 ?? ''
    });
    setAyuntamientoModalMode('edit');
  }

  function openCreateContactoModal() {
    setSelectedContactoId(null);
    setContactoForm(EMPTY_CONTACTO_FORM);
    setContactoModalMode('create');
  }

  function openEditContactoModal(contacto: ContactoRow) {
    setSelectedContactoId(contacto.id);
    setContactoForm({
      ayuntamiento_id: contacto.ayuntamiento_id ?? '',
      nombre_completo: contacto.nombre_completo ?? '',
      cargo: contacto.cargo ?? '',
      partido_politico: contacto.partido_politico ?? '',
      email: contacto.email ?? '',
      telefono: contacto.telefono ?? '',
      tratamiento: contacto.tratamiento ?? '',
      es_principal: Boolean(contacto.es_principal)
    });
    setContactoModalMode('edit');
  }

  function openCreateExpedienteModal() {
    setSelectedExpedienteId(null);
    setExpedienteForm(EMPTY_EXPEDIENTE_FORM);
    setExpedienteModalMode('create');
  }

  function openEditExpedienteModal(expediente: ExpedienteRow) {
    setSelectedExpedienteId(expediente.id);
    setExpedienteForm({
      ayuntamiento_id: expediente.ayuntamiento_id ?? '',
      num_expediente_sael: expediente.num_expediente_sael ?? '',
      num_expediente_rcon: expediente.num_expediente_rcon ?? '',
      fecha_solicitud: expediente.fecha_solicitud ?? '',
      fecha_resolucion: expediente.fecha_resolucion ?? '',
      estado: expediente.estado ?? '',
      num_informe: expediente.num_informe ?? '',
      num_expediente_externo: expediente.num_expediente_externo ?? '',
      asunto: expediente.asunto ?? '',
      tipo_procedimiento: expediente.tipo_procedimiento ?? '',
      medio_solicitud: expediente.medio_solicitud ?? ''
    });
    setExpedienteModalMode('edit');
  }

  function openEditNormativaModal(normativa: NormativaRow) {
    setSelectedNormativaId(normativa.id);
    setNormativaForm({
      titulo: normativa.titulo,
      texto_legal: normativa.texto_legal ?? '',
      categoria: normativa.categoria ?? 'General',
      es_obligatoria: Boolean(normativa.es_obligatoria)
    });
    setNormativaModalMode('edit');
  }

  function closeAyuntamientoModal() {
    setAyuntamientoModalMode(null);
    setSelectedAyuntamientoId(null);
    setAyuntamientoForm(EMPTY_AYUNTAMIENTO_FORM);
  }

  function closeContactoModal() {
    setContactoModalMode(null);
    setSelectedContactoId(null);
    setContactoForm(EMPTY_CONTACTO_FORM);
  }

  function closeExpedienteModal() {
    setExpedienteModalMode(null);
    setSelectedExpedienteId(null);
    setExpedienteForm(EMPTY_EXPEDIENTE_FORM);
  }

  function closeNormativaModal() {
    setNormativaModalMode(null);
    setSelectedNormativaId(null);
    setNormativaForm(EMPTY_NORMATIVA_FORM);
  }

  async function handleSubmitAyuntamiento() {
    setIsSavingAyuntamiento(true);

    try {
      if (ayuntamientoModalMode === 'create') {
        const created = await createAyuntamiento(ayuntamientoForm);
        setAyuntamientos((current) =>
          [...current, created].sort((left, right) => left.nombre.localeCompare(right.nombre))
        );
        setToast({ type: 'success', message: 'Ayuntamiento creado correctamente.' });
      }

      if (ayuntamientoModalMode === 'edit' && selectedAyuntamientoId) {
        const updated = await updateAyuntamiento(selectedAyuntamientoId, ayuntamientoForm);
        setAyuntamientos((current) =>
          current
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((left, right) => left.nombre.localeCompare(right.nombre))
        );
        setToast({ type: 'success', message: 'Ayuntamiento actualizado correctamente.' });
      }

      closeAyuntamientoModal();
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudo guardar el ayuntamiento.'
      });
    } finally {
      setIsSavingAyuntamiento(false);
    }
  }

  async function handleSubmitContacto() {
    setIsSavingContacto(true);

    try {
      if (contactoModalMode === 'create') {
        const created = await createContacto(contactoForm);
        setContactos((current) => [created, ...current]);
        setToast({ type: 'success', message: 'Contacto creado correctamente.' });
      }

      if (contactoModalMode === 'edit' && selectedContactoId) {
        const updated = await updateContacto(selectedContactoId, contactoForm);
        setContactos((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        setToast({ type: 'success', message: 'Contacto actualizado correctamente.' });
      }

      closeContactoModal();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar el contacto.'
      });
    } finally {
      setIsSavingContacto(false);
    }
  }

  async function handleSubmitExpediente() {
    setIsSavingExpediente(true);

    try {
      if (expedienteModalMode === 'create') {
        const created = await createExpediente(expedienteForm);
        setExpedientes((current) => [created, ...current]);
        setToast({ type: 'success', message: 'Expediente creado correctamente.' });
      }

      if (expedienteModalMode === 'edit' && selectedExpedienteId) {
        const updated = await updateExpediente(selectedExpedienteId, expedienteForm);
        setExpedientes((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        setToast({ type: 'success', message: 'Expediente actualizado correctamente.' });
      }

      closeExpedienteModal();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar el expediente.'
      });
    } finally {
      setIsSavingExpediente(false);
    }
  }

  async function handleSubmitNormativa() {
    setIsSavingNormativa(true);

    try {
      if (normativaModalMode === 'create') {
        const created = await createNormativa(normativaForm);
        setNormativas((current) => [created, ...current]);
        setToast({
          type: 'success',
          message: 'Normativa creada correctamente.'
        });
      }

      if (normativaModalMode === 'edit' && selectedNormativaId) {
        const updated = await updateNormativa(selectedNormativaId, normativaForm);
        setNormativas((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        setToast({
          type: 'success',
          message: 'Normativa actualizada correctamente.'
        });
      }

      closeNormativaModal();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar la normativa.'
      });
    } finally {
      setIsSavingNormativa(false);
    }
  }

  async function handleDeleteNormativa(normativa: NormativaRow) {
    const confirmed = window.confirm(
      `¿Seguro que quieres borrar la normativa "${normativa.titulo}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteNormativa(normativa.id);
      setNormativas((current) => current.filter((item) => item.id !== normativa.id));
      setToast({
        type: 'success',
        message: 'Normativa eliminada correctamente.'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo borrar la normativa.'
      });
    }
  }

  async function confirmDelete(label: string, action: () => Promise<void>) {
    const confirmed = window.confirm(`¿Seguro que quieres borrar ${label}?`);

    if (!confirmed) {
      return;
    }

    try {
      await action();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo borrar el registro.'
      });
    }
  }

  async function handleDeleteStorageFile(file: StorageFileItem) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar el archivo "${file.name}" del bucket informes?`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingStoragePath(file.path);

    try {
      await deleteStorageFile(file.path);
      setStorageFiles((current) => current.filter((item) => item.path !== file.path));
      setToast({
        type: 'success',
        message: 'Archivo eliminado del bucket correctamente.'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo borrar el archivo.'
      });
    } finally {
      setIsDeletingStoragePath(null);
    }
  }

  function renderNormativasTab() {
    return (
      <SectionCard
        title="Normativas"
        description="CRUD completo sobre la tabla Normativa como base del panel administrativo."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {isLoadingNormativas
              ? 'Cargando normativas...'
              : `${normativas.length} registros encontrados`}
          </div>
          <button
            type="button"
            onClick={openCreateNormativaModal}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]"
          >
            Añadir Nuevo
          </button>
        </div>

        {isLoadingNormativas ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Cargando datos de normativa...
          </div>
        ) : normativas.length === 0 ? (
          <EmptyTableState label="normativas" />
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
            <table className="min-w-[1500px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Titulo</th>
                  <th className="px-4 py-4">Categoria</th>
                  <th className="px-4 py-4">Obligatoria</th>
                  <th className="px-4 py-4">Creada</th>
                  <th className="px-4 py-4">Texto legal</th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {normativas.map((normativa) => (
                  <tr key={normativa.id} className="align-top">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{normativa.id}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{normativa.titulo}</td>
                    <td className="px-4 py-4">{normativa.categoria ?? 'General'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          normativa.es_obligatoria
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {normativa.es_obligatoria ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(normativa.created_at)}
                    </td>
                    <td className="max-w-lg px-4 py-4 text-slate-600">
                      <div className="line-clamp-4 whitespace-pre-wrap">
                        {normativa.texto_legal || 'Sin texto legal'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditNormativaModal(normativa)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteNormativa(normativa)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderAyuntamientosTab() {
    return (
      <SectionCard
        title="Ayuntamientos"
        description="Listado y CRUD de la tabla Ayuntamiento conectado a Supabase."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {isLoadingAyuntamientos
              ? 'Cargando ayuntamientos...'
              : `${ayuntamientos.length} registros encontrados`}
          </div>
          <button
            type="button"
            onClick={openCreateAyuntamientoModal}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]"
          >
            Añadir Nuevo
          </button>
        </div>

        {isLoadingAyuntamientos ? (
          <EmptyTableState label="ayuntamientos" />
        ) : ayuntamientos.length === 0 ? (
          <EmptyTableState label="ayuntamientos" />
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
            <table className="min-w-[1600px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Nombre</th>
                  <th className="px-4 py-4">CIF</th>
                  <th className="px-4 py-4">Comarca</th>
                  <th className="px-4 py-4">Codigo postal</th>
                  <th className="px-4 py-4">Poblacion</th>
                  <th className="px-4 py-4">Direccion sede</th>
                  <th className="px-4 py-4">Web dominio</th>
                  <th className="px-4 py-4">Email generico</th>
                  <th className="px-4 py-4">Gentilicio</th>
                  <th className="px-4 py-4">DIR3</th>
                  <th className="px-4 py-4">Creado</th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {ayuntamientos.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{item.nombre}</td>
                    <td className="px-4 py-4">{item.cif ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.comarca ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.codigo_postal ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.poblacion ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.direccion_sede ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.web_dominio ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.email_generico ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.gentilicio ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.codigo_dir3 ?? 'N/D'}</td>
                    <td className="px-4 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditAyuntamientoModal(item)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void confirmDelete(`el ayuntamiento "${item.nombre}"`, async () => {
                              await deleteAyuntamiento(item.id);
                              setAyuntamientos((current) =>
                                current.filter((row) => row.id !== item.id)
                              );
                              setContactos((current) =>
                                current.filter((row) => row.ayuntamiento_id !== item.id)
                              );
                              setExpedientes((current) =>
                                current.filter((row) => row.ayuntamiento_id !== item.id)
                              );
                              setToast({
                                type: 'success',
                                message: 'Ayuntamiento eliminado correctamente.'
                              });
                            })
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderContactosTab() {
    return (
      <SectionCard
        title="Contactos"
        description="Listado y CRUD de la tabla Contacto conectado a Supabase."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {isLoadingContactos
              ? 'Cargando contactos...'
              : `${contactos.length} registros encontrados`}
          </div>
          <button
            type="button"
            onClick={openCreateContactoModal}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]"
          >
            Añadir Nuevo
          </button>
        </div>

        {isLoadingContactos ? (
          <EmptyTableState label="contactos" />
        ) : contactos.length === 0 ? (
          <EmptyTableState label="contactos" />
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
            <table className="min-w-[1700px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Nombre</th>
                  <th className="px-4 py-4">Ayuntamiento</th>
                  <th className="px-4 py-4">Cargo</th>
                  <th className="px-4 py-4">Partido politico</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Telefono</th>
                  <th className="px-4 py-4">Tratamiento</th>
                  <th className="px-4 py-4">Principal</th>
                  <th className="px-4 py-4">Creado</th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {contactos.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {item.nombre_completo ?? 'Sin nombre'}
                    </td>
                    <td className="px-4 py-4">
                      {item.ayuntamiento_id
                        ? ayuntamientoNameById.get(item.ayuntamiento_id) ?? item.ayuntamiento_id
                        : 'Sin ayuntamiento'}
                    </td>
                    <td className="px-4 py-4">{item.cargo ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.partido_politico ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.email ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.telefono ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.tratamiento ?? 'N/D'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.es_principal
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.es_principal ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditContactoModal(item)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void confirmDelete(`el contacto "${item.nombre_completo ?? item.id}"`, async () => {
                              await deleteContacto(item.id);
                              setContactos((current) =>
                                current.filter((row) => row.id !== item.id)
                              );
                              setToast({
                                type: 'success',
                                message: 'Contacto eliminado correctamente.'
                              });
                            })
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderExpedientesTab() {
    return (
      <SectionCard
        title="Expedientes"
        description="Listado y CRUD de la tabla Expediente conectado a Supabase."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {isLoadingExpedientes
              ? 'Cargando expedientes...'
              : `${expedientes.length} registros encontrados`}
          </div>
          <button
            type="button"
            onClick={openCreateExpedienteModal}
            className="rounded-2xl bg-[#16324f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23486f]"
          >
            Añadir Nuevo
          </button>
        </div>

        {isLoadingExpedientes ? (
          <EmptyTableState label="expedientes" />
        ) : expedientes.length === 0 ? (
          <EmptyTableState label="expedientes" />
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
            <table className="min-w-[1900px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Ayuntamiento</th>
                  <th className="px-4 py-4">SAEL</th>
                  <th className="px-4 py-4">RCON</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Solicitud</th>
                  <th className="px-4 py-4">Resolucion</th>
                  <th className="px-4 py-4">Numero informe</th>
                  <th className="px-4 py-4">Numero externo</th>
                  <th className="px-4 py-4">Asunto</th>
                  <th className="px-4 py-4">Tipo procedimiento</th>
                  <th className="px-4 py-4">Medio solicitud</th>
                  <th className="px-4 py-4">Creado</th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {expedientes.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-4">
                      {item.ayuntamiento_id
                        ? ayuntamientoNameById.get(item.ayuntamiento_id) ?? item.ayuntamiento_id
                        : 'Sin ayuntamiento'}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {item.num_expediente_sael ?? 'N/D'}
                    </td>
                    <td className="px-4 py-4">{item.num_expediente_rcon ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.estado ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.fecha_solicitud ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.fecha_resolucion ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.num_informe ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.num_expediente_externo ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.asunto ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.tipo_procedimiento ?? 'N/D'}</td>
                    <td className="px-4 py-4">{item.medio_solicitud ?? 'N/D'}</td>
                    <td className="px-4 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditExpedienteModal(item)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void confirmDelete(`el expediente "${item.num_expediente_sael ?? item.id}"`, async () => {
                              await deleteExpediente(item.id);
                              setExpedientes((current) =>
                                current.filter((row) => row.id !== item.id)
                              );
                              setToast({
                                type: 'success',
                                message: 'Expediente eliminado correctamente.'
                              });
                            })
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderStorageTab() {
    return (
      <SectionCard
        title="Storage (Archivos)"
        description="Visor del bucket informes con acciones de descarga y eliminacion."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {isLoadingStorage
              ? 'Cargando archivos...'
              : `${storageFiles.length} archivos encontrados`}
          </div>
          <button
            type="button"
            onClick={() => void loadStorageFiles()}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Recargar lista
          </button>
        </div>

        {isLoadingStorage ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Cargando archivos del bucket...
          </div>
        ) : storageFiles.length === 0 ? (
          <EmptyTableState label="archivos" />
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
            <table className="min-w-[1400px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Archivo</th>
                  <th className="px-4 py-4">Ruta</th>
                  <th className="px-4 py-4">Tamaño</th>
                  <th className="px-4 py-4">Creado</th>
                  <th className="px-4 py-4">Actualizado</th>
                  <th className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {storageFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{file.id}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{file.name}</td>
                    <td className="px-4 py-4">{file.path}</td>
                    <td className="px-4 py-4">{formatSize(file.size)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(file.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Descargar
                        </a>
                        <button
                          type="button"
                          disabled={isDeletingStoragePath === file.path}
                          onClick={() => void handleDeleteStorageFile(file)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeletingStoragePath === file.path ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderActiveContent() {
    switch (activeTab) {
      case 'ayuntamientos':
        return renderAyuntamientosTab();
      case 'contactos':
        return renderContactosTab();
      case 'expedientes':
        return renderExpedientesTab();
      case 'normativas':
        return renderNormativasTab();
      case 'storage':
        return renderStorageTab();
      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#edf2f7_100%)] text-slate-900">
      <div className="border-b border-slate-200 bg-[#16324f] text-white shadow-lg">
          <div className="flex w-full items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
              SAEL REPORTS
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[0.08em]">
              Panel de Administración
            </h1>
          </div>

          <a
            href="/"
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Volver al generador
          </a>
        </div>
      </div>

      <div className="grid w-full gap-6 px-6 py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="px-3 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Secciones
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Administración total
            </h2>
          </div>

          <nav className="space-y-2">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition ${
                  activeTab === tab.id
                    ? 'border-[#16324f] bg-[#16324f] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold">{tab.label}</div>
                <div
                  className={`mt-1 text-xs ${
                    activeTab === tab.id ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {tab.description}
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Vista activa
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {activeTabMeta.label}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{activeTabMeta.description}</p>
          </div>

          {renderActiveContent()}
        </div>
      </div>

      {ayuntamientoModalMode ? (
        <CrudModal
          title={
            ayuntamientoModalMode === 'create'
              ? 'Añadir Ayuntamiento'
              : 'Editar Ayuntamiento'
          }
          subtitle="Ayuntamiento"
          fields={ayuntamientoFields}
          values={ayuntamientoForm}
          onChange={(key, value) =>
            setAyuntamientoForm((current) => ({ ...current, [key]: String(value) }))
          }
          onClose={closeAyuntamientoModal}
          onSubmit={() => void handleSubmitAyuntamiento()}
          isSaving={isSavingAyuntamiento}
        />
      ) : null}

      {contactoModalMode ? (
        <CrudModal
          title={contactoModalMode === 'create' ? 'Añadir Contacto' : 'Editar Contacto'}
          subtitle="Contacto"
          fields={contactoFields}
          values={contactoForm}
          onChange={(key, value) =>
            setContactoForm((current) => ({
              ...current,
              [key]: typeof value === 'boolean' ? value : String(value)
            }))
          }
          onClose={closeContactoModal}
          onSubmit={() => void handleSubmitContacto()}
          isSaving={isSavingContacto}
        />
      ) : null}

      {expedienteModalMode ? (
        <CrudModal
          title={
            expedienteModalMode === 'create'
              ? 'Añadir Expediente'
              : 'Editar Expediente'
          }
          subtitle="Expediente"
          fields={expedienteFields}
          values={expedienteForm}
          onChange={(key, value) =>
            setExpedienteForm((current) => ({ ...current, [key]: String(value) }))
          }
          onClose={closeExpedienteModal}
          onSubmit={() => void handleSubmitExpediente()}
          isSaving={isSavingExpediente}
        />
      ) : null}

      {normativaModalMode ? (
        <NormativaModal
          mode={normativaModalMode}
          values={normativaForm}
          onChange={setNormativaForm}
          onClose={closeNormativaModal}
          onSubmit={() => void handleSubmitNormativa()}
          isSaving={isSavingNormativa}
        />
      ) : null}

      {toast ? (
        <div className="fixed right-6 top-6 z-[70] max-w-md">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </main>
  );
}
