import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSession as requestCreateSession, listSessions } from './sessionsApi'
import type { CreateSessionInput, Session, SessionStatus } from './types'

export type SessionFilterValue = 'all' | SessionStatus
type ListStatus = 'loading' | 'ready' | 'error'
type CreateStatus = 'idle' | 'submitting' | 'error'

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [listStatus, setListStatus] = useState<ListStatus>('loading')
  const [listError, setListError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SessionFilterValue>('all')
  const [createStatus, setCreateStatus] = useState<CreateStatus>('idle')
  const [createError, setCreateError] = useState<string | null>(null)

  const load = useCallback(() => {
    listSessions()
      .then((result) => {
        setSessions(result)
        setListStatus('ready')
      })
      .catch((error: unknown) => {
        setListStatus('error')
        setListError(toErrorMessage(error, 'Could not load sessions. Please try again.'))
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retryLoad = useCallback(() => {
    setListStatus('loading')
    setListError(null)
    load()
  }, [load])

  const createSession = useCallback(async (input: CreateSessionInput) => {
    setCreateStatus('submitting')
    setCreateError(null)

    try {
      const created = await requestCreateSession(input)
      setSessions((current) => [...current, created])
      setCreateStatus('idle')
    } catch (error) {
      setCreateStatus('error')
      setCreateError(toErrorMessage(error, 'Could not create the session. Please try again.'))
      throw error
    }
  }, [])

  const filteredSessions = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter((session) => session.status === filter)),
    [sessions, filter],
  )

  return {
    filteredSessions,
    listStatus,
    listError,
    retryLoad,
    filter,
    setFilter,
    createStatus,
    createError,
    createSession,
  }
}
