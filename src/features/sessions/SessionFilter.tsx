import type { SessionFilterValue } from './useSessions'
import type { SessionStatus } from './types'

const STATUS_OPTIONS: SessionStatus[] = ['scheduled', 'completed', 'cancelled']

interface SessionFilterProps {
  value: SessionFilterValue
  onChange: (value: SessionFilterValue) => void
}

export function SessionFilter({ value, onChange }: SessionFilterProps) {
  return (
    <div className="session-filter">
      <label htmlFor="session-status-filter">Status</label>
      <select
        id="session-status-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as SessionFilterValue)}
      >
        <option value="all">All</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status[0].toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}
