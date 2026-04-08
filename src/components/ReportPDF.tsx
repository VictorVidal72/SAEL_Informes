import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReportPdfPayload } from '../lib/report-payload';

const HEADER_IMAGE = '/Diputacion.png';
const FOOTER_IMAGE = '/pie-pagina.png';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: '#1f2933',
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.45,
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#16324f',
    paddingBottom: 12,
    marginBottom: 18
  },
  spacer: {
    width: 150
  },
  institution: {
    maxWidth: 280,
    alignItems: 'flex-end'
  },
  institutionTitle: {
    color: '#16324f',
    fontSize: 12,
    fontWeight: 700
  },
  institutionLine: {
    color: '#52606d',
    fontSize: 9.5,
    textAlign: 'right'
  },
  code: {
    color: '#52606d',
    fontSize: 9,
    marginBottom: 12
  },
  meta: {
    marginBottom: 18
  },
  line: {
    marginBottom: 4
  },
  label: {
    color: '#16324f',
    fontWeight: 700
  },
  assunto: {
    backgroundColor: '#f4f7fb',
    borderLeftWidth: 4,
    borderLeftColor: '#16324f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 18
  },
  assuntoText: {
    color: '#16324f',
    fontSize: 11,
    fontWeight: 700
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify'
  },
  title: {
    color: '#16324f',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18
  },
  sectionTitle: {
    color: '#16324f',
    fontSize: 11,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 10
  },
  item: {
    marginBottom: 7,
    paddingLeft: 10
  },
  signatures: {
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#d9e2ec'
  },
  signatureBlock: {
    marginBottom: 16
  },
  signatureRole: {
    color: '#52606d',
    marginBottom: 3
  },
  signatureName: {
    color: '#16324f',
    fontWeight: 700
  }
});

interface ReportPDFProps {
  payload: ReportPdfPayload;
}

export default function ReportPDF({ payload }: ReportPDFProps) {
  const { data } = payload;
  const signatures = [
    data.firmantes.delegado
      ? { role: `El Delegado de Protección de Datos de ${data.municipio}`, name: 'Antonio Jesús Sánchez Guirado' }
      : null,
    data.firmantes.diputado
      ? { role: 'El Diputado de Asistencia a Municipios', name: 'Antonio Jesús Aragón Dorca' }
      : null,
    data.firmantes.coordinador
      ? { role: 'El coordinador del SAEL', name: 'Óscar Palma Delgado' }
      : null
  ].filter(Boolean) as Array<{ role: string; name: string }>;

  return (
    <Document title={payload.title}>
      <Page size="A4" style={styles.page}>
        <Image fixed src={data.logoUrl || HEADER_IMAGE} style={styles.headerImage} />
        <Image fixed src={FOOTER_IMAGE} style={styles.footerImage} />

        <View style={styles.topBar}>
          <View style={styles.spacer} />
          <View style={styles.institution}>
            <Text style={styles.institutionTitle}>Diputación de Cádiz</Text>
            <Text style={styles.institutionLine}>Servicio de Asistencia a Entidades Locales</Text>
            <Text style={styles.institutionLine}>Área de {data.area}</Text>
          </View>
        </View>

        <Text style={styles.code}>{payload.signatureCode}</Text>

        <View style={styles.meta}>
          <Text style={styles.line}><Text style={styles.label}>Nº Informe: </Text>{data.numeroInforme}</Text>
          <Text style={styles.line}><Text style={styles.label}>Nº Expediente SAEL: </Text>{data.numeroSael}</Text>
          <Text style={styles.line}><Text style={styles.label}>Nº Expediente Externo: </Text>{data.numeroExterno}</Text>
          <Text style={styles.line}><Text style={styles.label}>Nº Expediente RCON: </Text>{data.numeroRcon}</Text>
        </View>

        <View style={styles.assunto}>
          <Text style={styles.assuntoText}>ASUNTO: Informe sobre {data.asunto}.</Text>
        </View>

        <Text style={styles.paragraph}>{payload.introduction}</Text>
        <Text style={styles.paragraph}>
          Antonio Jesús Sánchez Guirado, Delegado de Protección de Datos provincial de la Diputación
          de Cádiz, emite el siguiente informe en el ejercicio de las funciones atribuidas por el
          artículo 39 del Reglamento Europeo de Protección de Datos.
        </Text>

        <Text style={styles.title}>INFORME DEL DELEGADO DE PROTECCIÓN DE DATOS</Text>
        <Text style={styles.sectionTitle}>ANTECEDENTES DE HECHO</Text>
        <Text style={styles.item}>1. {data.hecho1}</Text>
        <Text style={styles.item}>2. {data.hecho2}</Text>
        <Text style={styles.item}>3. {data.hecho3}</Text>
        <Text style={styles.sectionTitle}>NORMATIVA</Text>
        <Text style={styles.item}>1. {data.normativa1}</Text>
        <Text style={styles.item}>2. {data.normativa2}</Text>
        <Text style={styles.item}>3. {data.normativa3}</Text>
        <Text style={styles.sectionTitle}>FUNDAMENTOS DE DERECHO</Text>
        <Text style={styles.paragraph}>{data.derechos1}</Text>
        <Text style={styles.sectionTitle}>CONCLUSIONES</Text>
        <Text style={styles.paragraph}>{data.conclusion1}</Text>

        <View style={styles.signatures}>
          {signatures.map((signature) => (
            <View key={signature.role} style={styles.signatureBlock}>
              <Text style={styles.signatureRole}>{signature.role}</Text>
              <Text style={styles.signatureName}>{signature.name}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
