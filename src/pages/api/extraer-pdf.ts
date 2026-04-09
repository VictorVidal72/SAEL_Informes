import type { APIRoute } from 'astro';
import { PDFParse } from 'pdf-parse';
import {
  extractPdfAdministrativeData,
  mergeExtractedPdfData,
  type ExtractedPdfData
} from '../../lib/pdf-extraction';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const incomingFiles = formData.getAll('files');
    const fallbackFile = formData.get('file');
    const pdfFiles = (
      incomingFiles.length > 0 ? incomingFiles : fallbackFile ? [fallbackFile] : []
    ).filter((item): item is File => item instanceof File);

    if (pdfFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Debes enviar al menos un archivo PDF.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const invalidFile = pdfFiles.find(
      (file) => file.type && file.type !== 'application/pdf'
    );

    if (invalidFile) {
      return new Response(
        JSON.stringify({ error: 'El archivo recibido no es un PDF valido.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const documents: Array<{ fileName: string; extracted: ExtractedPdfData }> = [];

    for (const pdfFile of pdfFiles) {
      const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
      const parser = new PDFParse({ data: fileBuffer });

      try {
        const textResult = await parser.getText();
        documents.push({
          fileName: pdfFile.name,
          extracted: extractPdfAdministrativeData(textResult.text ?? '')
        });
      } finally {
        await parser.destroy();
      }
    }

    return new Response(
      JSON.stringify({
        documents,
        merged: mergeExtractedPdfData(documents.map((item) => item.extracted))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error al procesar el PDF:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? `Fallo interno: ${error.message}`
            : 'No se pudo analizar el PDF.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
