import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { RemisionPdfPayload } from '../lib/report-payload';

const HEADER_IMAGE = '/Diputacion.png';
const FOOTER_IMAGE = '/pie-pagina.png';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: '#1f2933',
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.45,
    paddingTop: 92,
    paddingBottom: 92,
    paddingHorizontal: 44
  },
  headerImage: {
    position: 'absolute',
    top: 16,
    left: 24,
    width: 170,
    height: 56
  },
  footerImage: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    width: 150,
    height: 26
  },
  title: {
    color: '#16324f',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 18
  },
  block: {
    marginBottom: 12
  },
  label: {
    fontWeight: 700,
    color: '#16324f'
  },
  paragraph: {
    marginTop: 12,
    textAlign: 'justify'
  },
  signatures: {
    marginTop: 36,
    flexDirection: 'row',
    gap: 28
  },
  signatureBox: {
    flex: 1
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#8a9aac',
    marginBottom: 8,
    minHeight: 36
  },
  signatureRole: {
    fontSize: 10,
    color: '#52606d'
  }
});

interface OficioRemisionPDFProps {
  payload: RemisionPdfPayload;
}

export default function OficioRemisionPDF({ payload }: OficioRemisionPDFProps) {
  const asunto = payload.data.asunto?.trim() || 'Sin asunto';
  const tratamiento = payload.data.tratamiento?.trim() || 'Alcalde/Alcaldesa';

  return (
    <Document title={payload.title}>
      <Page size="A4" style={styles.page}>
        <Image fixed src={payload.data.logoUrl || HEADER_IMAGE} style={styles.headerImage} />
        <Image fixed src={FOOTER_IMAGE} style={styles.footerImage} />

        <Text style={styles.title}>OFICIO DE REMISION</Text>

        <View style={styles.block}>
          <Text>
            <Text style={styles.label}>Alcalde/Alcaldesa (Tratamiento): </Text>
            {tratamiento}
          </Text>
        </View>
        <View style={styles.block}>
          <Text>
            <Text style={styles.label}>Ayuntamiento de: </Text>
            {payload.data.municipio}
          </Text>
        </View>
        <View style={styles.block}>
          <Text>
            <Text style={styles.label}>Referencia SAEL: </Text>
            {payload.data.numeroSael}
          </Text>
        </View>
        <View style={styles.block}>
          <Text>
            <Text style={styles.label}>Asunto: </Text>
            {asunto}
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Se remite el informe del delegado de proteccion de datos provincial de {payload.data.municipio}
          , para su conocimiento y efectos oportunos.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}> </Text>
            <Text style={styles.signatureRole}>El Diputado de Asistencia a Municipios</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}> </Text>
            <Text style={styles.signatureRole}>El Responsable</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
