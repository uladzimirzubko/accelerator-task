import { fetchSessions, insertSession } from './mockSessionsStore'
import type { CreateSessionInput, Session } from './types'

export function listSessions(): Promise<Session[]> {
  return fetchSessions()
}

export function createSession(input: CreateSessionInput): Promise<Session> {
  return insertSession(input)
}
