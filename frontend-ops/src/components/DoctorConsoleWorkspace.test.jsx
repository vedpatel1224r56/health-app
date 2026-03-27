/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DoctorConsoleWorkspace } from './DoctorConsoleWorkspace'

afterEach(() => cleanup())

const baseAppointment = {
  id: 8,
  patient_name: 'Chloe Jeffery',
  department_name: 'General Medicine',
  reason: 'General health check-up',
  scheduled_at: '2026-03-13T12:40:00.000Z',
  status: 'approved',
}

const baseEncounter = {
  encounter: { id: 7, status: 'open' },
  notes: [],
  prescriptions: [],
  orders: [],
}

function renderWorkspace(overrides = {}) {
  const props = {
    doctorConsoleStatus: '',
    appointments: [baseAppointment],
    activeConsultAppointment: baseAppointment,
    activeEncounterDetail: baseEncounter,
    openDoctorConsult: vi.fn(),
    encounterForm: {
      chiefComplaint: '',
      vitalsText: '',
      findings: '',
      diagnosisCode: '',
      diagnosisText: '',
      planText: '',
      followupDate: '',
      status: 'open',
    },
    setEncounterForm: vi.fn(),
    saveEncounterSummary: vi.fn(),
    noteDraft: '',
    setNoteDraft: vi.fn(),
    signatureDraft: '',
    setSignatureDraft: vi.fn(),
    submitEncounterNote: vi.fn(),
    prescriptionDraft: {
      instructions: '',
      items: [{ medicine: '', dose: '', frequency: '', duration: '', route: '', notes: '' }],
    },
    setPrescriptionDraft: vi.fn(),
    addPrescriptionItem: vi.fn(),
    removePrescriptionItem: vi.fn(),
    updatePrescriptionItem: vi.fn(),
    submitPrescription: vi.fn(),
    orderDraft: { orderType: 'lab', itemName: '', destination: '', notes: '' },
    setOrderDraft: vi.fn(),
    submitEncounterOrder: vi.fn(),
    ...overrides,
  }
  render(<DoctorConsoleWorkspace {...props} />)
  return props
}

describe('DoctorConsoleWorkspace', () => {
  it('opens another consult from the worklist selector', () => {
    const openDoctorConsult = vi.fn()
    renderWorkspace({
      appointments: [
        baseAppointment,
        { ...baseAppointment, id: 9, patient_name: 'Ved', scheduled_at: '2026-03-14T10:00:00.000Z' },
      ],
      openDoctorConsult,
    })

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '9' } })

    expect(openDoctorConsult).toHaveBeenCalledWith('9')
  })

  it('switches to notes view', () => {
    renderWorkspace()

    fireEvent.click(screen.getAllByRole('button', { name: 'Notes' })[0])

    expect(screen.getByText('Doctor note')).toBeInTheDocument()
    expect(screen.getByLabelText('Clinical note')).toBeInTheDocument()
  })
})
