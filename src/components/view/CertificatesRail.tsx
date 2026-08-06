import { ExternalLink } from 'lucide-react'
import type { Certificate } from '@/types'
import CertificateSeal from './CertificateSeal'

type Props = {
  certificates: Certificate[]
}

export default function CertificatesRail({ certificates }: Props) {
  return (
    <section className="py-6 border-t border-ink-raised">
      <h2 className="text-label uppercase tracking-label text-muted mb-3 px-6 @min-[1024px]:px-0">Actifs certifiés</h2>

      {certificates.length === 0 ? (
        <p className="text-sm text-muted px-6 @min-[1024px]:px-0">Aucun certificat renseigné pour le moment.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-6 pb-1">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="snap-start shrink-0 w-56 rounded-lg border border-ink-raised bg-ink-raised/40 p-4"
            >
              <CertificateSeal />
              <p className="mt-2 font-medium text-sm leading-snug">{cert.title}</p>
              <p className="text-xs text-muted mt-0.5 font-mono">
                {cert.institution} · {cert.year}
              </p>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 min-h-11 text-xs text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
                >
                  Vérifier <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
