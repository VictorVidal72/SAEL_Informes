import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AyuntamientoRow {
  id: string;
  nombre: string;
  cif: string | null;
  comarca: string | null;
  codigo_postal: string | null;
  poblacion: number | null;
  direccion_sede: string | null;
  web_dominio: string | null;
  email_generico: string | null;
  gentilicio: string | null;
  created_at: string;
  codigo_dir3: string | null;
}

export interface ContactoRow {
  id: string;
  ayuntamiento_id: string | null;
  nombre_completo: string | null;
  cargo: string | null;
  partido_politico: string | null;
  email: string | null;
  telefono: string | null;
  tratamiento: string | null;
  es_principal: boolean | null;
  created_at: string;
}

export interface ExpedienteRow {
  id: string;
  ayuntamiento_id: string | null;
  num_expediente_sael: string | null;
  num_expediente_rcon: string | null;
  fecha_solicitud: string | null;
  fecha_resolucion: string | null;
  estado: string | null;
  created_at: string;
  num_informe: string | null;
  num_expediente_externo: string | null;
  asunto: string | null;
  tipo_procedimiento: string | null;
  medio_solicitud: string | null;
}
