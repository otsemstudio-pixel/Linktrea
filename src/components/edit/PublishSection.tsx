import { useFormContext, useWatch } from 'react-hook-form'
import type { Profile } from '@/types'
import { usePublishState } from './usePublishState'
import PublishForm from './PublishForm'

export default function PublishSection() {
  const { control } = useFormContext<Profile>()
  const fullName = useWatch({ control, name: 'identity.fullName' })
  const state = usePublishState(fullName)

  return <PublishForm {...state} />
}
