import {
  supabase,
  type AyuntamientoRow,
  type ContactoRow,
  type ExpedienteRow
} from '../lib/supabase';

export interface AyuntamientoInput {
  nombre: string;
  cif: string;
  comarca: string;
  codigo_postal: string;
  poblacion: string;
  direccion_sede: string;
  web_dominio: string;
  email_generico: string;
  gentilicio: string;
  codigo_dir3: string;
}

export interface ContactoInput {
  ayuntamiento_id: string;
  nombre_completo: string;
  cargo: string;
  partido_politico: string;
  email: string;
  telefono: string;
  tratamiento: string;
  es_principal: boolean;
}

export interface ExpedienteInput {
  ayuntamiento_id: string;
  num_expediente_sael: string;
  num_expediente_rcon: string;
  fecha_solicitud: string;
  fecha_resolucion: string;
  estado: string;
  num_informe: string;
  num_expediente_externo: string;
  asunto: string;
  tipo_procedimiento: string;
  medio_solicitud: string;
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toNullableInteger(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : Number(trimmed);
}

export async function fetchAyuntamientosAdmin(): Promise<AyuntamientoRow[]> {
  const { data, error } = await supabase
    .from('Ayuntamiento')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los ayuntamientos: ${error.message}`);
  }

  return (data as AyuntamientoRow[]) ?? [];
}

export async function createAyuntamiento(
  input: AyuntamientoInput
): Promise<AyuntamientoRow> {
  const { data, error } = await supabase
    .from('Ayuntamiento')
    .insert({
      nombre: input.nombre.trim(),
      cif: toNullableString(input.cif),
      comarca: toNullableString(input.comarca),
      codigo_postal: toNullableString(input.codigo_postal),
      poblacion: toNullableInteger(input.poblacion),
      direccion_sede: toNullableString(input.direccion_sede),
      web_dominio: toNullableString(input.web_dominio),
      email_generico: toNullableString(input.email_generico),
      gentilicio: toNullableString(input.gentilicio),
      codigo_dir3: toNullableString(input.codigo_dir3)
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo crear el ayuntamiento: ${error.message}`);
  }

  return data as AyuntamientoRow;
}

export async function updateAyuntamiento(
  id: string,
  input: AyuntamientoInput
): Promise<AyuntamientoRow> {
  const { data, error } = await supabase
    .from('Ayuntamiento')
    .update({
      nombre: input.nombre.trim(),
      cif: toNullableString(input.cif),
      comarca: toNullableString(input.comarca),
      codigo_postal: toNullableString(input.codigo_postal),
      poblacion: toNullableInteger(input.poblacion),
      direccion_sede: toNullableString(input.direccion_sede),
      web_dominio: toNullableString(input.web_dominio),
      email_generico: toNullableString(input.email_generico),
      gentilicio: toNullableString(input.gentilicio),
      codigo_dir3: toNullableString(input.codigo_dir3)
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el ayuntamiento: ${error.message}`);
  }

  return data as AyuntamientoRow;
}

export async function deleteAyuntamiento(id: string): Promise<void> {
  const { error } = await supabase.from('Ayuntamiento').delete().eq('id', id);

  if (error) {
    throw new Error(`No se pudo borrar el ayuntamiento: ${error.message}`);
  }
}

export async function fetchContactosAdmin(): Promise<ContactoRow[]> {
  const { data, error } = await supabase
    .from('Contacto')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los contactos: ${error.message}`);
  }

  return (data as ContactoRow[]) ?? [];
}

export async function createContacto(input: ContactoInput): Promise<ContactoRow> {
  const { data, error } = await supabase
    .from('Contacto')
    .insert({
      ayuntamiento_id: toNullableString(input.ayuntamiento_id),
      nombre_completo: toNullableString(input.nombre_completo),
      cargo: toNullableString(input.cargo),
      partido_politico: toNullableString(input.partido_politico),
      email: toNullableString(input.email),
      telefono: toNullableString(input.telefono),
      tratamiento: toNullableString(input.tratamiento),
      es_principal: input.es_principal
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo crear el contacto: ${error.message}`);
  }

  return data as ContactoRow;
}

export async function updateContacto(
  id: string,
  input: ContactoInput
): Promise<ContactoRow> {
  const { data, error } = await supabase
    .from('Contacto')
    .update({
      ayuntamiento_id: toNullableString(input.ayuntamiento_id),
      nombre_completo: toNullableString(input.nombre_completo),
      cargo: toNullableString(input.cargo),
      partido_politico: toNullableString(input.partido_politico),
      email: toNullableString(input.email),
      telefono: toNullableString(input.telefono),
      tratamiento: toNullableString(input.tratamiento),
      es_principal: input.es_principal
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el contacto: ${error.message}`);
  }

  return data as ContactoRow;
}

export async function deleteContacto(id: string): Promise<void> {
  const { error } = await supabase.from('Contacto').delete().eq('id', id);

  if (error) {
    throw new Error(`No se pudo borrar el contacto: ${error.message}`);
  }
}

export async function fetchExpedientesAdmin(): Promise<ExpedienteRow[]> {
  const { data, error } = await supabase
    .from('Expediente')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los expedientes: ${error.message}`);
  }

  return (data as ExpedienteRow[]) ?? [];
}

export async function createExpediente(
  input: ExpedienteInput
): Promise<ExpedienteRow> {
  const { data, error } = await supabase
    .from('Expediente')
    .insert({
      ayuntamiento_id: toNullableString(input.ayuntamiento_id),
      num_expediente_sael: toNullableString(input.num_expediente_sael),
      num_expediente_rcon: toNullableString(input.num_expediente_rcon),
      fecha_solicitud: toNullableString(input.fecha_solicitud),
      fecha_resolucion: toNullableString(input.fecha_resolucion),
      estado: toNullableString(input.estado),
      num_informe: toNullableString(input.num_informe),
      num_expediente_externo: toNullableString(input.num_expediente_externo),
      asunto: toNullableString(input.asunto),
      tipo_procedimiento: toNullableString(input.tipo_procedimiento),
      medio_solicitud: toNullableString(input.medio_solicitud)
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo crear el expediente: ${error.message}`);
  }

  return data as ExpedienteRow;
}

export async function updateExpediente(
  id: string,
  input: ExpedienteInput
): Promise<ExpedienteRow> {
  const { data, error } = await supabase
    .from('Expediente')
    .update({
      ayuntamiento_id: toNullableString(input.ayuntamiento_id),
      num_expediente_sael: toNullableString(input.num_expediente_sael),
      num_expediente_rcon: toNullableString(input.num_expediente_rcon),
      fecha_solicitud: toNullableString(input.fecha_solicitud),
      fecha_resolucion: toNullableString(input.fecha_resolucion),
      estado: toNullableString(input.estado),
      num_informe: toNullableString(input.num_informe),
      num_expediente_externo: toNullableString(input.num_expediente_externo),
      asunto: toNullableString(input.asunto),
      tipo_procedimiento: toNullableString(input.tipo_procedimiento),
      medio_solicitud: toNullableString(input.medio_solicitud)
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el expediente: ${error.message}`);
  }

  return data as ExpedienteRow;
}

export async function deleteExpediente(id: string): Promise<void> {
  const { error } = await supabase.from('Expediente').delete().eq('id', id);

  if (error) {
    throw new Error(`No se pudo borrar el expediente: ${error.message}`);
  }
}
