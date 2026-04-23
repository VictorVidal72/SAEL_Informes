import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  TextRun
} from 'docx';
import type { ReportFormData } from '../lib/report-model';

const VERDANA = 'Verdana';
const SIZE_TEXT = 22; // 11 pt
const SIZE_HEADING = 24; // 12 pt
const MARGIN_25_CM = 1417; // twips (2.5 cm)

function textRun(text: string, bold = false, size = SIZE_TEXT) {
  return new TextRun({
    text,
    bold,
    font: VERDANA,
    size
  });
}

function paragraph(text: string, options?: { bold?: boolean; spacingAfter?: number }) {
  return new Paragraph({
    children: [textRun(text, options?.bold)],
    spacing: { after: options?.spacingAfter ?? 160 }
  });
}

function toNameCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function getSignatures(values: ReportFormData): Array<{ cargo: string; nombre: string }> {
  return [
    values.firmantes.delegado
      ? {
          cargo: `El Delegado de Proteccion de Datos de ${values.municipio}`,
          nombre: 'Antonio Jesus Sanchez Guirado'
        }
      : null,
    values.firmantes.diputado
      ? {
          cargo: 'El Diputado de Asistencia a Municipios',
          nombre: 'Antonio Jesus Aragon Dorca'
        }
      : null,
    values.firmantes.coordinador
      ? {
          cargo: 'El coordinador del SAEL',
          nombre: 'Oscar Palma Delgado'
        }
      : null
  ].filter(Boolean) as Array<{ cargo: string; nombre: string }>;
}

function buildSignatureParagraphs(values: ReportFormData): Paragraph[] {
  const signatures = getSignatures(values);
  if (signatures.length === 0) {
    return [];
  }

  const first = signatures[0];
  const second = signatures[1];
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: '', spacing: { before: 200, after: 140 } }),
    new Paragraph({
      children: [textRun(first.nombre.toUpperCase(), true)],
      spacing: { after: 80 }
    }),
    new Paragraph({
      children: [textRun(first.cargo)],
      spacing: { after: second ? 260 : 120 }
    })
  ];

  if (second) {
    paragraphs.push(
      new Paragraph({
        children: [textRun(toNameCase(second.nombre), true)],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [textRun(second.cargo)],
        spacing: { after: 120 }
      })
    );
  }

  return paragraphs;
}

function numberedSection(title: string, values: string[]) {
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [textRun(title, true, SIZE_HEADING)],
      spacing: { after: 140 }
    })
  ];

  if (normalized.length === 0) {
    paragraphs.push(paragraph('(Sin contenido)'));
    return paragraphs;
  }

  normalized.forEach((value, index) => {
    paragraphs.push(paragraph(`${index + 1}. ${value}`));
  });

  return paragraphs;
}

function buildInformeDoc(values: ReportFormData) {
  const asunto = values.asunto?.trim() || 'Sin asunto';
  const applicant = [
    values.solicitanteNombre,
    values.solicitanteApellido1,
    values.solicitanteApellido2
  ]
    .filter(Boolean)
    .join(' ');

  const normativa = [
    values.normativaObligatoria,
    ...values.normativasOpcionales,
    values.normativaAdicional
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: MARGIN_25_CM,
              right: MARGIN_25_CM,
              bottom: MARGIN_25_CM,
              left: MARGIN_25_CM
            }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [textRun('INFORME DEL DELEGADO DE PROTECCION DE DATOS', true, SIZE_HEADING)],
            spacing: { after: 220 }
          }),
          paragraph(`Nº Informe: ${values.numeroInforme}`),
          paragraph(`Referencia SAEL: ${values.numeroSael}`),
          paragraph(`Referencia Externa: ${values.numeroExterno}`),
          paragraph(`Referencia RCON: ${values.numeroRcon}`),
          paragraph(`Asunto: ${asunto}`, true),
          paragraph(
            `Recibida peticion mediante ${values.medioSolicitud} de fecha ${values.fechaSolicitud} de ${applicant} del ${values.servicio} del area de ${values.area} del Ayuntamiento de ${values.municipio}.`
          ),
          paragraph(
            `Antonio Jesus Sanchez Guirado, Delegado de Proteccion de Datos provincial, emite el siguiente informe.`
          ),
          ...numberedSection('ANTECEDENTES DE HECHO', values.antecedentesHecho),
          ...numberedSection('NORMATIVA', normativa),
          ...numberedSection('FUNDAMENTOS DE DERECHO', values.fundamentosDerecho),
          ...numberedSection('CONCLUSIONES', values.conclusiones),
          ...buildSignatureParagraphs(values)
        ]
      }
    ]
  });
}

function buildOficioDoc(values: ReportFormData) {
  const tratamiento = values.tratamiento?.trim() || 'Alcalde/Alcaldesa';
  const asunto = values.asunto?.trim() || 'Sin asunto';

  return new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: MARGIN_25_CM,
              right: MARGIN_25_CM,
              bottom: MARGIN_25_CM,
              left: MARGIN_25_CM
            }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [textRun('OFICIO DE REMISION', true, SIZE_HEADING)],
            spacing: { after: 220 }
          }),
          paragraph(`Alcalde/Alcaldesa (Tratamiento): ${tratamiento}`),
          paragraph(`Ayuntamiento de ${values.municipio}`),
          paragraph(`Referencia SAEL: ${values.numeroSael}`),
          paragraph(`Asunto: ${asunto}`, true),
          paragraph(
            `Se remite el informe del delegado de proteccion de datos provincial de ${values.municipio}, para su conocimiento y efectos oportunos.`,
            false,
            220
          ),
          ...buildSignatureParagraphs(values)
        ]
      }
    ]
  });
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadEditablePack(values: ReportFormData) {
  const baseName = values.numeroSael?.trim() || values.municipio?.trim() || 'SAEL';
  const safeName = baseName.replace(/[^\w\-]+/g, '_');

  const [informeBlob, oficioBlob] = await Promise.all([
    Packer.toBlob(buildInformeDoc(values)),
    Packer.toBlob(buildOficioDoc(values))
  ]);

  triggerDownload(informeBlob, `Informe_DPD_${safeName}.docx`);
  window.setTimeout(() => {
    triggerDownload(oficioBlob, `Oficio_Remision_${safeName}.docx`);
  }, 150);
}
