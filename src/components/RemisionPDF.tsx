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
    lineHeight: 1.5,
    paddingTop: 92,
    paddingBottom: 82,
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
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 18
  },
  line: {
    marginBottom: 12
  },
  block: {
    marginBottom: 16
  }
});

interface RemisionPDFProps {
  payload: RemisionPdfPayload;
}

export default function RemisionPDF({ payload }: RemisionPDFProps) {
  return (
    <Document title={payload.title}>
      <Page size="A4" style={styles.page}>
        <Image fixed src={payload.data.logoUrl || HEADER_IMAGE} style={styles.headerImage} />
        <Image fixed src={FOOTER_IMAGE} style={styles.footerImage} />

        <Text style={styles.title}>OFICIO DE REMISIÓN</Text>
        <View style={styles.block}>
          <Text style={styles.line}>Destinatario: {payload.destinatario}</Text>
          <Text style={styles.line}>Referencia: {payload.referencia}</Text>
          <Text style={styles.line}>Municipio: {payload.data.municipio}</Text>
        </View>

        <Text style={styles.line}>{payload.cuerpo}</Text>
        <Text style={styles.line}>
          Se adjunta el informe emitido por el Delegado de Protección de Datos para su conocimiento y efectos oportunos.
        </Text>
      </Page>
    </Document>
  );
}
