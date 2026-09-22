const TITLE_MIN_LENGTH = 3
const TITLE_MAX_LENGTH = 80

export function validateTitle(rawTitle: string): string | null {
  const title = rawTitle.trim()

  if (title.length === 0) {
    return 'Title is required.'
  }

  if (title.length < TITLE_MIN_LENGTH) {
    return `Title must be at least ${TITLE_MIN_LENGTH} characters.`
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`
  }

  return null
}

export function validateStartAt(rawValue: string): string | null {
  if (rawValue.trim().length === 0) {
    return 'Date and time are required.'
  }

  const startAt = new Date(rawValue)

  if (Number.isNaN(startAt.getTime())) {
    return 'Enter a valid date and time.'
  }

  if (startAt.getTime() <= Date.now()) {
    return 'Date and time must be in the future.'
  }

  return null
}
