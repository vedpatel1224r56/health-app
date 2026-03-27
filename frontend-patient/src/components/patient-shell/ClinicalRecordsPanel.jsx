import { useState } from "react";

function renderDepartmentSummary(detail) {
  const departmentKey = detail?.departmentForm?.departmentKey || detail?.departmentForm?.department_key;
  const form = detail?.departmentForm?.form || {};
  if (departmentKey === "surgery") {
    const items = [
      { label: "Procedure planned", value: form.procedurePlanned },
      { label: "Consent status", value: form.consentStatus },
      { label: "Indication", value: form.indication },
      { label: "Pre-op notes", value: form.preOpNotes },
      { label: "Post-op notes", value: form.postOpNotes },
      { label: "Surgical follow-up review", value: form.followUpReview },
    ].filter((item) => String(item.value || "").trim());
    if (!items.length) return null;
    return (
      <div className="history-list" style={{ marginTop: 12 }}>
        <div className="history-card">
          <p className="history-headline">Surgery details</p>
          {items.map((item) => (
            <p key={`clinical-surgery-detail-${item.label}`} className="micro">
              <strong>{item.label}:</strong> {item.value}
            </p>
          ))}
        </div>
      </div>
    );
  }
  if (departmentKey === "pediatrics") {
    const growthValue = [form.weightKg ? `${form.weightKg} kg` : "", form.heightCm ? `${form.heightCm} cm` : ""]
      .filter(Boolean)
      .join(" • ");
    const items = [
      { label: "Guardian", value: form.guardianName },
      { label: "Growth", value: growthValue },
      { label: "Growth notes", value: form.growthNotes },
      { label: "Immunization context", value: form.immunizationContext },
      { label: "Pediatric dosing context", value: form.pediatricDoseNotes },
      { label: "Follow-up pediatric notes", value: form.followUpPediatricNotes },
    ].filter((item) => String(item.value || "").trim());
    if (!items.length) return null;
    return (
      <div className="history-list" style={{ marginTop: 12 }}>
        <div className="history-card">
          <p className="history-headline">Pediatrics details</p>
          {items.map((item) => (
            <p key={`clinical-pediatrics-detail-${item.label}`} className="micro">
              <strong>{item.label}:</strong> {item.value}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function ClinicalRecordsPanel({
  encounters,
  activeEncounterId,
  setActiveEncounterId,
  encounterDetail,
  encounterStatus,
}) {
  const [viewTab, setViewTab] = useState("prescriptions");
  const activeEncounter = encounterDetail?.encounter || null;
  const visitCount = encounters.length;
  const latestEncounterDate =
    activeEncounter?.appointment_scheduled_at ||
    activeEncounter?.teleconsult_preferred_slot ||
    activeEncounter?.created_at ||
    activeEncounter?.scheduled_at;
  const activeEncounterType = activeEncounter?.teleconsult_id ? "Remote consult" : "Visit record";

  return (
    <section className="panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Clinical Records</p>
          <h2>Prescriptions and doctor orders</h2>
          <p className="panel-sub">Open a visit record to review prescriptions, doctor notes, and department-specific care details.</p>
        </div>
      </div>

      <div className="clinical-shell-hero">
        <div className="clinical-shell-stats">
          <article className="clinical-shell-stat">
            <span className="mini-label">Clinical records</span>
            <strong>{visitCount}</strong>
            <span className="micro">Consults available in your timeline</span>
          </article>
          <article className="clinical-shell-stat">
            <span className="mini-label">Active doctor</span>
            <strong>{activeEncounter?.doctor_name || "-"}</strong>
            <span className="micro">Doctor for the open record</span>
          </article>
          <article className="clinical-shell-stat">
            <span className="mini-label">Latest record</span>
            <strong>{latestEncounterDate ? new Date(latestEncounterDate).toLocaleDateString() : "-"}</strong>
            <span className="micro">Most recent visit in focus</span>
          </article>
        </div>
      </div>

      {encounterStatus ? <p className="micro">{encounterStatus}</p> : null}

      <div className="member-list">
        {encounters.map((encounter) => (
          <button
            key={`clinical-encounter-${encounter.id}`}
            type="button"
            className={encounter.id === activeEncounterId ? "chip active" : "chip"}
            onClick={() => setActiveEncounterId(encounter.id)}
          >
            {encounter.teleconsult_id ? "Remote" : "Visit"} {encounter.id}
          </button>
        ))}
      </div>

      {encounterDetail ? (
        <div className="pass-card clinical-record-shell" style={{ marginTop: 12 }}>
          <div className="clinical-record-summary">
            <div className="clinical-record-summary-card">
              <span className="mini-label">Record type</span>
              <strong>{activeEncounterType}</strong>
            </div>
            <div className="clinical-record-summary-card">
              <span className="mini-label">Diagnosis</span>
              <strong>{activeEncounter?.diagnosis_text || activeEncounter?.diagnosis_code || "-"}</strong>
            </div>
            <div className="clinical-record-summary-card">
              <span className="mini-label">Plan</span>
              <strong>{activeEncounter?.plan_text || "-"}</strong>
            </div>
            <div className="clinical-record-summary-card">
              <span className="mini-label">Follow-up</span>
              <strong>{activeEncounter?.followup_date || "-"}</strong>
            </div>
          </div>
          <div className="member-list clinical-tab-strip" style={{ marginBottom: 12 }}>
            <button type="button" className={viewTab === "summary" ? "chip active" : "chip"} onClick={() => setViewTab("summary")}>
              Summary
            </button>
            <button type="button" className={viewTab === "notes" ? "chip active" : "chip"} onClick={() => setViewTab("notes")}>
              Notes
            </button>
            <button type="button" className={viewTab === "prescriptions" ? "chip active" : "chip"} onClick={() => setViewTab("prescriptions")}>
              Prescriptions
            </button>
            <button type="button" className={viewTab === "orders" ? "chip active" : "chip"} onClick={() => setViewTab("orders")}>
              Orders
            </button>
          </div>

          {viewTab === "summary" ? (
            <>
              <p className="micro"><strong>Doctor:</strong> {encounterDetail.encounter?.doctor_name || "-"}</p>
              <p className="micro">
                <strong>Consult:</strong>{" "}
                {encounterDetail.teleconsult
                  ? `${encounterDetail.teleconsult.mode?.toUpperCase() || "REMOTE"} • ${encounterDetail.teleconsult.concern || "-"}`
                  : encounterDetail.appointment?.reason || "-"}
              </p>
              <p className="micro"><strong>Diagnosis:</strong> {encounterDetail.encounter?.diagnosis_text || encounterDetail.encounter?.diagnosis_code || "-"}</p>
              <p className="micro"><strong>Plan:</strong> {encounterDetail.encounter?.plan_text || "-"}</p>
              {renderDepartmentSummary(encounterDetail)}
            </>
          ) : null}

          {viewTab === "notes" ? (
            <div className="history-list">
              {(encounterDetail.notes || []).length === 0 ? (
                <p className="micro">No clinical notes yet.</p>
              ) : (
                (encounterDetail.notes || []).map((note) => (
                  <div key={`clinical-note-${note.id}`} className="history-card">
                    <p className="micro">{note.note_text}</p>
                    <p className="micro">{note.signature_text || "Unsigned"} • {new Date(note.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {viewTab === "prescriptions" ? (
            <div className="history-list">
              {(encounterDetail.prescriptions || []).length === 0 ? (
                <p className="micro">No prescriptions available yet.</p>
              ) : (
                (encounterDetail.prescriptions || []).map((rx) => (
                  <div key={`clinical-rx-${rx.id}`} className="history-card">
                    <p className="history-headline">Prescription #{rx.id}</p>
                    <p className="micro">{rx.instructions || "No instructions"}</p>
                    <div className="history-list" style={{ marginTop: 8 }}>
                      {(rx.items || []).map((item) => (
                        <div key={`clinical-rx-item-${item.id}`} className="history-card">
                          <p className="micro"><strong>{item.medicine}</strong></p>
                          <p className="micro">{item.dose || "-"} • {item.frequency || "-"} • {item.duration || "-"}</p>
                          <p className="micro">{item.route || "-"}{item.notes ? ` • ${item.notes}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {viewTab === "orders" ? (
            <div className="history-list">
              {(encounterDetail.orders || []).length === 0 ? (
                <p className="micro">No doctor orders available yet.</p>
              ) : (
                (encounterDetail.orders || []).map((order) => (
                  <div key={`clinical-order-${order.id}`} className="history-card">
                    <p className="history-headline">{order.item_name}</p>
                    <p className="micro">{order.order_type} • {order.status}</p>
                    <p className="micro">{order.destination || "-"}</p>
                    {order.notes ? <p className="micro">{order.notes}</p> : null}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="micro">No clinical visit records yet.</p>
      )}
    </section>
  );
}
