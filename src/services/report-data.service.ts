import { supabase, type AyuntamientoRow, type ContactoRow, type ExpedienteRow } from '../lib/supabase';
import type { ReportDataBundle } from '../lib/report-model';

function isActiveStatus(status: string | null): boolean {
  const normalized = status?.trim().toLowerCase() ?? '';
  return ['activo', 'activa', 'abierto', 'en curso', 'en tramitacion', 'en tramitación'].includes(
    normalized
  );
}

export async function fetchAyuntamientos(): Promise<AyuntamientoRow[]> {
  const { data, error } = await supabase
    .from('Ayuntamiento')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`No se pudo cargar Ayuntamiento: ${error.message}`);
  }

  return (data as AyuntamientoRow[]) ?? [];
}

export async function fetchAyuntamientoBundle(
  ayuntamientoId: string
): Promise<ReportDataBundle> {
  const [ayuntamientoResponse, contactosResponse, expedientesResponse] = await Promise.all([
    supabase.from('Ayuntamiento').select('*').eq('id', ayuntamientoId).single(),
    supabase
      .from('Contacto')
      .select('*')
      .eq('ayuntamiento_id', ayuntamientoId)
      .order('es_principal', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('Expediente')
      .select('*')
      .eq('ayuntamiento_id', ayuntamientoId)
      .order('created_at', { ascending: false })
  ]);

  if (ayuntamientoResponse.error) {
    throw new Error(`No se pudo cargar el Ayuntamiento seleccionado: ${ayuntamientoResponse.error.message}`);
  }

  if (contactosResponse.error) {
    throw new Error(`No se pudo cargar Contacto: ${contactosResponse.error.message}`);
  }

  if (expedientesResponse.error) {
    throw new Error(`No se pudo cargar Expediente: ${expedientesResponse.error.message}`);
  }

  const contactos = (contactosResponse.data as ContactoRow[]) ?? [];
  const expedientes = ((expedientesResponse.data as ExpedienteRow[]) ?? []).sort((left, right) => {
    const leftPriority = isActiveStatus(left.estado) ? 0 : 1;
    const rightPriority = isActiveStatus(right.estado) ? 0 : 1;
    return leftPriority - rightPriority;
  });

  return {
    ayuntamiento: ayuntamientoResponse.data as AyuntamientoRow,
    contactoPrincipal: contactos.find((item) => item.es_principal) ?? contactos.at(0) ?? null,
    expedientes
  };
}
