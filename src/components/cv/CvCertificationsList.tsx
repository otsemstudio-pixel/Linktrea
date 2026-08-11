import type { CvCertification } from '@/lib/cv/mapProfileToCv'

type Props = {
  certifications: CvCertification[]
}

export default function CvCertificationsList({ certifications }: Props) {
  return (
    <ul className="cv-cert-list">
      {certifications.map((cert) => (
        <li key={cert.id}>
          {cert.title} — {cert.institution} ({cert.year})
        </li>
      ))}
    </ul>
  )
}
