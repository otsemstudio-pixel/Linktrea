import { ExternalLink } from 'lucide-react'
import type { Certificate, Domain } from '@/types'
import CertificateSeal from './CertificateSeal'
import { VOCABULARY } from '@/lib/vocabulary'
import { recordLinkClick } from '@/lib/stats'

type Props = {
  domain: Domain
  certificates: Certificate[]
  slug?: string | null
}

export default function CertificatesRail({ domain, certificates, slug }: Props) {
  const vocabulary = VOCABULARY[domain]

  return (
    <section className="py-6 border-t border-ink-raised">
      <h2 className="text-label uppercase tracking-label text-muted mb-3 px-6 @min-[1024px]:px-0">{vocabulary.certifications}</h2>

      {certificates.length === 0 ? (
        <p className="text-sm text-muted px-6 @min-[1024px]:px-0">Aucun certificat renseigné pour le moment.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-6 pb-1">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="snap-start shrink-0 w-56 rounded-[var(--radius-md)] p-4"
              style={{
                background: 'var(--card-bg)',
                color: 'var(--card-fg)',
                borderStyle: 'solid',
                borderWidth: 'var(--card-border-width)',
                borderColor: 'var(--card-border-color)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <CertificateSeal domain={domain} />
              <p className="mt-2 font-medium text-sm leading-snug">{cert.title}</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--card-fg-muted)' }}>
                {cert.institution} · {cert.year}
              </p>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordLinkClick(slug, cert.id)}
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
