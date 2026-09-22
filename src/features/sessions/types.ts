export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Session {
  id: string
  title: string
  status: SessionStatus
  startAt: string
}

export interface CreateSessionInput {
  title: string
  startAt: string
}
