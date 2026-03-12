'use client'

import { useFeatureFlagEnabled } from 'posthog-js/react'

export function FeatureFlagBanner() {
  const enabled = useFeatureFlagEnabled('test')

  if (!enabled) return null

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
      🚀 New feature coming soon — stay tuned!
    </div>
  )
}
