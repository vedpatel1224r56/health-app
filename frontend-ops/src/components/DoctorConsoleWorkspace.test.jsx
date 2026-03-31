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

  it('locks video room actions until doctor consent is accepted', () => {
    renderWorkspace({
      isRemoteConsult: true,
      activeConsultAppointment: {
        ...baseAppointment,
        mode: 'video',
        status: 'scheduled',
      },
      remoteConsultConsentSummary: { doctorAccepted: false, patientAccepted: true },
      remoteConsultMessages: [],
      remoteConsultMessageText: '',
      setRemoteConsultMessageText: vi.fn(),
      sendRemoteConsultMessage: vi.fn(),
      updateRemoteConsultStatus: vi.fn(),
    })

    fireEvent.click(screen.getByRole('button', { name: /Video/ }))

    expect(screen.getByRole('button', { name: 'Start video' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Camera off' })).toBeDisabled()
    expect(
      screen.getByText('Acknowledge the teleconsult notice and keep the consult scheduled to unlock live video.'),
    ).toBeInTheDocument()
  })

  it('shows live call controls for remote video consults after consent', () => {
    renderWorkspace({
      isRemoteConsult: true,
      activeConsultAppointment: {
        ...baseAppointment,
        id: 21,
        mode: 'video',
        status: 'scheduled',
      },
      remoteConsultConsentSummary: { doctorAccepted: true, patientAccepted: true },
      remoteConsultMessages: [],
      remoteConsultMessageText: '',
      setRemoteConsultMessageText: vi.fn(),
      sendRemoteConsultMessage: vi.fn(),
      updateRemoteConsultStatus: vi.fn(),
    })

    fireEvent.click(screen.getByRole('button', { name: /Video/ }))

    expect(screen.getByRole('button', { name: 'Start video' })).toBeEnabled()
    expect(screen.getByText('Doctor')).toBeInTheDocument()
    expect(screen.getByText('Patient')).toBeInTheDocument()
  })
})
