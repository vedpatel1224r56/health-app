import { describe, expect, it } from 'vitest'
import { getAllowedAppointmentStatuses, normalizeAppointmentStatus, appointmentStatusLabel } from './opsConfig'

describe('appointment transition rules', () => {
  it('normalizes approved to scheduled label for UI transitions', () => {
    expect(normalizeAppointmentStatus('approved')).toBe('approved')
    expect(appointmentStatusLabel('approved')).toBe('Scheduled')
  })

  it('allows only deterministic forward transitions', () => {
    expect(getAllowedAppointmentStatuses('requested')).toEqual(['requested', 'approved', 'cancelled'])
    expect(getAllowedAppointmentStatuses('approved')).toEqual(['approved', 'checked_in', 'cancelled', 'no_show'])
    expect(getAllowedAppointmentStatuses('checked_in')).toEqual(['checked_in', 'completed', 'cancelled', 'no_show'])
  })
})
