'use client'

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'

function PostHogAuthSync() {
  const { user, isLoaded } = useUser()
  const phog = usePostHog()

  useEffect(() => {
    if (!isLoaded) return
    if (user) {
      phog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      })
    } else {
      phog.reset()
    }
  }, [user, isLoaded, phog])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30'
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <PostHogAuthSync />
      {children}
    </PHProvider>
  )
}
