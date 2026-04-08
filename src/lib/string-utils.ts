export function inferirTratamiento(cargo: string | null | undefined): string {
  const normalizedCargo = cargo?.toLowerCase() ?? '';

  if (
    normalizedCargo.includes('alcaldesa') ||
    normalizedCargo.includes('presidenta') ||
    normalizedCargo.includes('concejala') ||
    normalizedCargo.includes('diputada') ||
    normalizedCargo.includes('directora')
  ) {
    return 'Doña';
  }

  if (
    normalizedCargo.includes('alcalde') ||
    normalizedCargo.includes('presidente') ||
    normalizedCargo.includes('concejal') ||
    normalizedCargo.includes('diputado') ||
    normalizedCargo.includes('director')
  ) {
    return 'Don';
  }

  return '';
}
