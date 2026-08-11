import type { CvSkillGroup } from '@/lib/cv/mapProfileToCv'

type Props = {
  groups: CvSkillGroup[]
}

export default function CvSkillsList({ groups }: Props) {
  return (
    <>
      {groups.map((group) => (
        <p key={group.category || '—'} className="cv-skill-group">
          {group.category && <strong>{group.category} : </strong>}
          {group.items.join(', ')}
        </p>
      ))}
    </>
  )
}
