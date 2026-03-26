import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReportFormData } from '../lib/report-model';
import {
  buildApplicantFullName,
  buildSignatureCode,
  formatDisplayDate
} from '../lib/report-model';

const HEADER_IMAGE = '/Diputacion.png';
const FOOTER_IMAGE = '/pie-pagina.png';

const COLORS = {
  navy: '#16324f',
  steel: '#52606d',
  light: '#d9e2ec',
  soft: '#f4f7fb'
};

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
    borderBottomColor: COLORS.navy,
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
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 700
  },
  institutionLine: {
    color: COLORS.steel,
    fontSize: 9.5,
    textAlign: 'right'
  },
  signatureCode: {
    color: COLORS.steel,
    fontSize: 9,
    marginBottom: 12
  },
  metadata: {
    marginBottom: 18
  },
  metadataLine: {
    marginBottom: 4
  },
  label: {
    color: COLORS.navy,
    fontWeight: 700
  },
  asuntoBox: {
    backgroundColor: COLORS.soft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.navy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 18
  },
  asuntoText: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: 700
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify'
  },
  title: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18
  },
  sectionTitle: {
    color: COLORS.navy,
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
    borderTopColor: COLORS.light
  },
  signatureBlock: {
    marginBottom: 16
  },
  signatureRole: {
    color: COLORS.steel,
    marginBottom: 3
  },
  signatureName: {
    color: COLORS.navy,
    fontWeight: 700
  }
});

interface ReportPDFProps {
  data: ReportFormData;
}

export default function ReportPDF({ data }: ReportPDFProps) {
  const applicant = buildApplicantFullName(data);
  const signatureCode = buildSignatureCode(data);
  const headerImage = data.logoUrl || HEADER_IMAGE;
  const signatures = [
    data.firmantes.delegado
      ? {
          role: `El Delegado de Protección de Datos de ${data.municipio}`,
          name: 'Antonio Jesús Sánchez Guirado'
        }
      : null,
    data.firmantes.diputado
      ? {
          role: 'El Diputado de Asistencia a Municipios',
          name: 'Antonio Jesús Aragón Dorca'
        }
      : null,
    data.firmantes.coordinador
      ? {
          role: 'El coordinador del SAEL',
          name: 'Óscar Palma Delgado'
        }
      : null
  ].filter(Boolean) as Array<{ role: string; name: string }>;

  const introduction = data.llevaOficioRemision
    ? `Recibida petición mediante ${data.medioSolicitud} de fecha ${formatDisplayDate(data.fechaSolicitud)} de ${applicant} del ${data.servicio} del Área de ${data.area} del Ayuntamiento de ${data.municipio}, solicitando asistencia técnica en materia de Protección de Datos.`
    : `Se emite informe en relación con el expediente ${data.numeroSael} del Ayuntamiento de ${data.municipio}.`;

  return (
    <Document title={`Informe ${data.numeroSael || data.municipio}`}>
      <Page size="A4" style={styles.page}>
        <Image fixed src={headerImage} style={styles.headerImage} />
        <Image fixed src={FOOTER_IMAGE} style={styles.footerImage} />

        <View style={styles.topBar}>
          <View style={styles.spacer} />

          <View style={styles.institution}>
            <Text style={styles.institutionTitle}>Diputación de Cádiz</Text>
            <Text style={styles.institutionLine}>Servicio de Asistencia a Entidades Locales</Text>
            <Text style={styles.institutionLine}>Área de {data.area}</Text>
          </View>
        </View>

        <Text style={styles.signatureCode}>{signatureCode}</Text>

        <View style={styles.metadata}>
          <Text style={styles.metadataLine}>
            <Text style={styles.label}>Nº Informe: </Text>
            {data.numeroInforme}
          </Text>
          <Text style={styles.metadataLine}>
            <Text style={styles.label}>Nº Expediente SAEL: </Text>
            {data.numeroSael}
          </Text>
          <Text style={styles.metadataLine}>
            <Text style={styles.label}>Nº Expediente Externo: </Text>
            {data.numeroExterno}
          </Text>
          <Text style={styles.metadataLine}>
            <Text style={styles.label}>Nº Expediente RCON: </Text>
            {data.numeroRcon}
          </Text>
        </View>

        <View style={styles.asuntoBox}>
          <Text style={styles.asuntoText}>ASUNTO: Informe sobre {data.asunto}.</Text>
        </View>

        <Text style={styles.paragraph}>{introduction}</Text>

        <Text style={styles.paragraph}>
          Antonio Jesús Sánchez Guirado, Delegado de Protección de Datos provincial de la
          Diputación de Cádiz, en uso de las atribuciones que le son conferidas por el artículo
          39 del Reglamento Europeo de Protección de Datos, emite el siguiente informe.
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

        {data.llevaOficioRemision ? (
          <Text style={styles.paragraph}>
            Se da traslado de este informe a {data.personaRemision} para su conocimiento y efectos
            oportunos.
          </Text>
        ) : null}

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
