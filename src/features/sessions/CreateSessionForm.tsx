import { useState, type FormEvent } from 'react'
import { validateStartAt, validateTitle } from './validation'
import type { CreateSessionInput } from './types'

interface CreateSessionFormProps {
  onSubmit: (input: CreateSessionInput) => Promise<void>
  onCancel: () => void
  submitError: string | null
  isSubmitting: boolean
}

export function CreateSessionForm({ onSubmit, onCancel, submitError, isSubmitting }: CreateSessionFormProps) {
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [startAtError, setStartAtError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitleError = validateTitle(title)
    const nextStartAtError = validateStartAt(startAt)
    setTitleError(nextTitleError)
    setStartAtError(nextStartAtError)

    if (nextTitleError || nextStartAtError) {
      return
    }

    try {
      await onSubmit({ title: title.trim(), startAt: new Date(startAt).toISOString() })
    } catch {
      // submitError prop reflects the failure; keep the form open with entered values.
    }
  }

  return (
    <form className="create-session-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="session-title">Title</label>
        <input
          id="session-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isSubmitting}
        />
        {titleError ? (
          <p className="field-error" role="alert">
            {titleError}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="session-start-at">Date and time</label>
        <input
          id="session-start-at"
          type="datetime-local"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          disabled={isSubmitting}
        />
        {startAtError ? (
          <p className="field-error" role="alert">
            {startAtError}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="field-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="create-session-form__actions">
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
