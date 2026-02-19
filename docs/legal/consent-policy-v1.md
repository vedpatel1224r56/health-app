# Consent Policy v1

Version: v1
Effective date: 2026-02-12

## Required consent types
- `medical_disclaimer`
- `privacy_policy`
- `terms_of_use`

## Consent event format
Each consent action should store:
- user_id
- consent_type
- policy_version
- accepted (true/false)
- created_at

## UX requirement
Before symptom triage, users must acknowledge the medical disclaimer.

## Audit requirement
Consent events are immutable logs and must be retained for compliance review.
