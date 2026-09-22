import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SessionsWorkspace } from './SessionsWorkspace'

describe('SessionsWorkspace', () => {
  it('loads the seeded sessions and adds a newly created session to the visible list', async () => {
    const user = userEvent.setup()
    render(<SessionsWorkspace />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading sessions')

    await waitFor(
      () => {
        expect(screen.getByText('React Fundamentals Workshop')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    await user.click(screen.getByRole('button', { name: 'New Session' }))

    const futureStartAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const datetimeLocalValue = futureStartAt.toISOString().slice(0, 16)

    await user.type(screen.getByLabelText('Title'), 'Accessibility Basics Workshop')
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: datetimeLocalValue },
    })

    await user.click(screen.getByRole('button', { name: 'Create session' }))

    await waitFor(
      () => {
        expect(screen.getByText('Accessibility Basics Workshop')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })
})
