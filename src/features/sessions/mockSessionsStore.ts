import type { CreateSessionInput, Session } from './types'

type MockOutcome = 'success' | 'error'

const MOCK_DELAY_MS = 300

function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

let sessions: Session[] = [
  {
    id: crypto.randomUUID(),
    title: 'React Fundamentals Workshop',
    status: 'scheduled',
    startAt: daysFromNow(3),
  },
  {
    id: crypto.randomUUID(),
    title: 'Advanced TypeScript Patterns',
    status: 'scheduled',
    startAt: daysFromNow(7),
  },
  {
    id: crypto.randomUUID(),
    title: 'Onboarding Retrospective',
    status: 'completed',
    startAt: daysFromNow(-5),
  },
  {
    id: crypto.randomUUID(),
    title: 'Design Systems Deep Dive',
    status: 'cancelled',
    startAt: daysFromNow(-2),
  },
]

let nextListOutcome: MockOutcome = 'success'
let nextCreateOutcome: MockOutcome = 'success'

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export function setNextListOutcome(outcome: MockOutcome): void {
  nextListOutcome = outcome
}

export function setNextCreateOutcome(outcome: MockOutcome): void {
  nextCreateOutcome = outcome
}

export async function fetchSessions(): Promise<Session[]> {
  await delay()

  if (nextListOutcome === 'error') {
    nextListOutcome = 'success'
    throw new Error('Could not load sessions. Please try again.')
  }

  return [...sessions]
}

export async function insertSession(input: CreateSessionInput): Promise<Session> {
  await delay()

  if (nextCreateOutcome === 'error') {
    nextCreateOutcome = 'success'
    throw new Error('Could not create the session. Please try again.')
  }

  const created: Session = {
    id: crypto.randomUUID(),
    title: input.title,
    status: 'scheduled',
    startAt: input.startAt,
  }

  sessions = [...sessions, created]
  return created
}
