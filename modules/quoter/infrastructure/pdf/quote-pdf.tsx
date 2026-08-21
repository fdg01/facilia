// modules/quoter/infrastructure/pdf/quote-pdf.ts
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead, BreakdownItem } from '../../domain/entities'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  subheader: { fontSize: 10, color: '#666', marginBottom: 20 },
  section: { marginBottom: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 12 },
  label: { fontSize: 10, color: '#666', marginBottom: 2 },
  value: { fontSize: 11, marginBottom: 6 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 'bold' },
  giftBox: { marginTop: 16, padding: 12, backgroundColor: '#fff8f0', borderRadius: 4 },
  giftTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  footer: { marginTop: 30, fontSize: 9, color: '#999', textAlign: 'center' },
})

interface PdfData {
  lead: Lead
  breakdown: BreakdownItem[]
  giftDescription: string | null
}

export function createQuotePdfDocument(data: PdfData) {
  const dateStr = data.lead.createdAt.toLocaleDateString('es-UY')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>FACILIA</Text>
        <Text style={styles.subheader}>Facility Services by CORE</Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>PRESUPUESTO Nº: {data.lead.number}</Text>
          <Text style={styles.label}>Fecha: {dateStr}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>Nombre: {data.lead.name}</Text>
          <Text style={styles.value}>Email: {data.lead.email}</Text>
          <Text style={styles.value}>Cel: {data.lead.phone}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>DETALLE</Text>
          {data.lead.mainLine && (
            <Text style={styles.value}>Línea: {data.lead.mainLine}</Text>
          )}
          {data.breakdown.map((item, i) => (
            <View key={i} style={styles.detailItem}>
              <Text>{item.label}</Text>
              <Text>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text>Costo mensual:</Text>
            <Text>${(data.lead.totalMonthly ?? 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Costo por visita:</Text>
            <Text>${(data.lead.totalPerVisit ?? 0).toFixed(2)}</Text>
          </View>
        </View>

        {data.lead.giftIncluded && data.giftDescription && (
          <View style={styles.giftBox}>
            <Text style={styles.giftTitle}>REGALO DE BIENVENIDA</Text>
            <Text>{data.giftDescription} (sin costo)</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Contacto: contacto@facilia.com · com.core.uy/facilia
        </Text>
      </Page>
    </Document>
  )
}

export async function generateQuotePdf(data: PdfData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const doc = createQuotePdfDocument(data)
  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer)
}

export async function uploadLeadPdf(
  client: SupabaseClient,
  leadId: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const path = `${leadId}/presupuesto.pdf`
  const { error } = await client
    .storage
    .from('leads')
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw error
  return path
}

export async function getSignedPdfUrl(
  client: SupabaseClient,
  leadId: string,
  expiresIn: number = 3600,
): Promise<string> {
  const { data, error } = await client
    .storage
    .from('leads')
    .createSignedUrl(`${leadId}/presupuesto.pdf`, expiresIn)

  if (error) throw error
  return data.signedUrl
}
