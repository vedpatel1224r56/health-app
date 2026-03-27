# Pilot Scope Freeze

Date: 2026-03-12

This freeze defines the product boundary for the current Savita/Vadodara pilot build. New work should deepen these flows, not expand unrelated modules.

## Patient Ops

- Home
- Appointments
- Labs
- Pharmacy
- Hospital
- Profile
- Notifications
- Health pass

## Hospital Ops

- Operations dashboard
- Patients
- Appointments
- Doctors
- Departments
- Hospital profile
- Hospital public content
- Visit types

## Pilot Promise

Faster OPD intake and better patient continuity for a Savita-anchored local care network in Vadodara.

## In Scope

- Savita-branded hospital information and packages in patient app
- Local lab discovery by area, price, ETA, and visit mode
- Local pharmacy discovery by area and fulfillment mode
- Patient appointment request and ops-side approval workflow
- Notifications for patient-facing status changes
- Profile completeness and registration readiness for hospital intake
- Hospital configuration of departments, doctors, visit types, and public content

## Out Of Scope For This Phase

- Full HMS billing stack
- Full IPD/ward/nursing workflows beyond seeded operational scaffolding
- Insurance claims processing
- National marketplace expansion
- Advanced inventory/store operations as a pilot dependency
- Clinical diagnosis claims

## Engineering Constraint

All backend refactors must preserve current API contracts while moving logic out of monolithic files into `routes/*`, `services/*`, and `db/*`.
