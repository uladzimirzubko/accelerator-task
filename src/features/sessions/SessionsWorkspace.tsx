import { useState } from 'react'
import { CreateSessionForm } from './CreateSessionForm'
import { SessionFilter } from './SessionFilter'
import { SessionList } from './SessionList'
import { useSessions } from './useSessions'
import type { CreateSessionInput } from './types'

export function SessionsWorkspace() {
  const {
    filteredSessions,
    listStatus,
    listError,
    retryLoad,
    filter,
    setFilter,
    createStatus,
    createError,
    createSession,
  } = useSessions()
  const [isFormOpen, setIsFormOpen] = useState(false)

  async function handleCreate(input: CreateSessionInput) {
    await createSession(input)
    setIsFormOpen(false)
  }

  return (
    <section className="sessions-workspace">
      <header className="sessions-workspace__header">
        <h1>Training Sessions</h1>
        <button type="button" className="button" onClick={() => setIsFormOpen((open) => !open)}>
          {isFormOpen ? 'Close' : 'New Session'}
        </button>
      </header>

      {isFormOpen ? (
        <CreateSessionForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          submitError={createError}
          isSubmitting={createStatus === 'submitting'}
        />
      ) : null}

      <SessionFilter value={filter} onChange={setFilter} />

      <SessionList sessions={filteredSessions} status={listStatus} error={listError} onRetry={retryLoad} />
    </section>
  )
}
