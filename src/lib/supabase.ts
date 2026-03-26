import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AyuntamientoRow {
  id: number;
  nombre: string;
  cif: string;
  comarca: string | null;
  codigo_postal: string | null;
  poblacion: string | null;
  direccion_sede: string | null;
  web_dominio: string | null;
  email_generico: string | null;
  gentilicio: string | null;
  created_at: string;
}

export interface ContactoRow {
  id: number;
  ayuntamiento_id: number;
  nombre_completo: string;
  cargo: string | null;
  partido_politico: string | null;
  email: string | null;
  telefono: string | null;
  tratamiento: string | null;
  es_principal: boolean | null;
  created_at: string;
}

export interface ExpedienteRow {
  id: number;
  ayuntamiento_id: number;
  num_expediente_sael: string | null;
  num_expediente_rcon: string | null;
  fecha_solicitud: string | null;
  fecha_resolucion: string | null;
  estado: string | null;
  created_at: string;
}
