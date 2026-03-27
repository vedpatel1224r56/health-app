import { describe, expect, it } from 'vitest'
import {
  appointmentStatusLabel,
  getAllowedAppointmentStatuses,
  normalizeAppointmentStatus,
} from './opsConfig'

describe('appointment transition rules', () => {
  it('normalizes scheduled to approved', () => {
    expect(normalizeAppointmentStatus('scheduled')).toBe('approved')
    expect(appointmentStatusLabel('scheduled')).toBe('Scheduled')
  })

  it('returns only valid transitions for requested appointments', () => {
    expect(getAllowedAppointmentStatuses('requested')).toEqual(['requested', 'approved', 'cancelled'])
  })

  it('returns only valid transitions for checked-in appointments', () => {
    expect(getAllowedAppointmentStatuses('checked_in')).toEqual(['checked_in', 'completed', 'cancelled', 'no_show'])
  })
})
