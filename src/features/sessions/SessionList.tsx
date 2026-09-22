import type { Session } from './types'

interface SessionListProps {
  sessions: Session[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
  onRetry: () => void
}

export function SessionList({ sessions, status, error, onRetry }: SessionListProps) {
  if (status === 'loading') {
    return (
      <p className="session-list__loading" role="status">
        Loading sessions…
      </p>
    )
  }

  if (status === 'error') {
    return (
      <div className="session-list__error" role="alert">
        <p>{error}</p>
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return <p className="session-list__empty">No sessions yet.</p>
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li key={session.id} className="session-list__row">
          <span className="session-list__title">{session.title}</span>
          <span className="session-list__status">{session.status}</span>
          <time className="session-list__time" dateTime={session.startAt}>
            {new Date(session.startAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  )
}
