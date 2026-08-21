// modules/portal/presentation/components/EvidenceGallery.tsx
import type { EvidenceItem } from '../../domain/portal-entities'

interface EvidenceGalleryProps {
  evidence: EvidenceItem[]
}

const typeLabels: Record<string, string> = {
  photo: 'Foto',
  video: 'Video',
  document: 'Documento',
  customer_signature: 'Firma',
}

export function EvidenceGallery({ evidence }: EvidenceGalleryProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Evidencias</h1>
      {evidence.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No hay evidencias autorizadas para tu organización
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {evidence.map((e) => (
            <a
              key={e.id}
              href={e.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {e.type === 'photo' ? (
                <img
                  src={e.signedUrl}
                  alt={e.description}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-3xl mb-2">
                    {e.type === 'video' ? '🎬' : e.type === 'customer_signature' ? '✍️' : '📄'}
                  </span>
                  <span className="text-sm text-gray-500">{typeLabels[e.type] ?? e.type}</span>
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{e.description}</p>
                <p className="text-xs text-gray-400 mt-1">{e.date.split('T')[0]}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
