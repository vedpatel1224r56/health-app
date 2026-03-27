/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsWorkspace } from './SettingsWorkspace'

function renderSettings(overrides = {}) {
  const props = {
    settingsStatus: '',
    loadHospitalSettings: vi.fn(),
    activeSettingsPanel: 'doctors',
    setActiveSettingsPanel: vi.fn(),
    hospitalProfileForm: {
      hospitalName: '',
      hospitalCode: '',
      contactPhone: '',
      contactEmail: '',
      addressLine: '',
      taluka: '',
      district: '',
      city: '',
      state: '',
      country: 'India',
      pinCode: '',
    },
    setHospitalProfileForm: vi.fn(),
    saveHospitalProfile: vi.fn(),
    visitTypes: [],
    setVisitTypes: vi.fn(),
    saveVisitTypes: vi.fn(),
    newDepartmentForm: { name: '', description: '', active: true },
    setNewDepartmentForm: vi.fn(),
    createDepartment: vi.fn(),
    departmentConfigs: [{ id: 1, name: 'General Medicine', active: true }],
    updateDepartmentDraft: vi.fn(),
    saveDepartmentConfig: vi.fn(),
    newDoctorForm: {
      name: '',
      email: '',
      password: '',
      departmentId: '',
      qualification: '',
      active: true,
    },
    setNewDoctorForm: vi.fn((updater) => {
      doctorForm = typeof updater === 'function' ? updater(doctorForm) : updater
    }),
    createDoctorConfig: vi.fn(),
    settingsDoctors: [],
    updateDoctorDraft: vi.fn(),
    saveDoctorConfig: vi.fn(),
    hospitalContentForm: {
      cashlessTitle: '',
      cashlessFacilityListText: '',
      tpaListText: '',
      corporateListText: '',
      tpaQueryPhone: '',
      scopeTitle: '',
      clinicalServicesText: '',
      stateOfTheArtText: '',
      services24x7Text: '',
      appointmentPhonesText: '',
      healthCheckupTitle: '',
      healthCheckupPlansText: '',
      ayushmanTitle: '',
      ayushmanBulletsText: '',
      ayushmanPhonesText: '',
      superSpecialitiesTitle: '',
      superSpecialitiesText: '',
      superSpecialitiesContact: '',
    },
    setHospitalContentForm: vi.fn(),
    saveHospitalContent: vi.fn(),
    ...overrides,
  }

  let doctorForm = props.newDoctorForm
  const setNewDoctorForm = vi.fn((updater) => {
    doctorForm = typeof updater === 'function' ? updater(doctorForm) : updater
  })
  props.setNewDoctorForm = overrides.setNewDoctorForm || setNewDoctorForm

  const view = render(<SettingsWorkspace {...props} />)
  return { ...view, props, getDoctorForm: () => doctorForm }
}

describe('SettingsWorkspace', () => {
  it('submits doctor creation from the doctors panel', () => {
    const createDoctorConfig = vi.fn()
    const { props } = renderSettings({ createDoctorConfig })

    fireEvent.change(screen.getByLabelText('Doctor name'), { target: { value: 'Dr. Krina Patel' } })
    fireEvent.change(screen.getByLabelText('Doctor email'), { target: { value: 'krina@example.com' } })
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add doctor' }))

    expect(props.setNewDoctorForm).toHaveBeenCalled()
    expect(createDoctorConfig).toHaveBeenCalledTimes(1)
  })
})
