function AudioConsultPanel({ consult, consentAccepted, roomReady }) {
  return (
    <div className="history-card subtle">
      <div className="section-head compact">
        <div>
          <p className="micro strong">Audio consult</p>
          <p className="micro">Your doctor will call you on the shared phone number at the scheduled time.</p>
        </div>
      </div>
      <p className="micro">
        {roomReady
          ? "Keep your phone nearby. The doctor will call the number shown for this consult."
          : "Once this consult is scheduled, the doctor will call you on the shared phone number."}
      </p>
      {!consentAccepted ? (
        <p className="micro">Accept the teleconsult notice below so the doctor can proceed with the phone call consult and documentation.</p>
      ) : null}
      <div className="teleconsult-room-actions">
        <span className="appointments-mode-pill">Phone-call audio workflow</span>
      </div>
    </div>
  );
}

export function TeleconsultRoomModal({
  consult,
  closeTeleconsultRoom,
  teleStatusLabel,
  consultMessages,
  consultConsentSummary,
  acceptConsultConsent,
  consultMessageText,
  setConsultMessageText,
  sendConsultMessage,
  consultMessageStatus,
}) {
  if (!consult) return null;

  const normalizedMode = String(consult.mode || "").toLowerCase();
  const roomReady = ["scheduled", "in_progress"].includes(String(consult.status || "").toLowerCase());
  const patientConsentAccepted = Boolean(consultConsentSummary?.patientAccepted);

  return (
    <div className="modal-backdrop" onClick={closeTeleconsultRoom}>
      <div className="modal appointment-modal teleconsult-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Remote consult</p>
            <h2>{normalizedMode === "chat" ? "Chat consult room" : `${normalizedMode || "Remote"} consult room`}</h2>
            <p className="panel-sub">
              {teleStatusLabel(consult.status) || consult.status} • {consult.preferredSlot ? new Date(consult.preferredSlot).toLocaleString() : "Preferred slot not added"}
            </p>
          </div>
          <button className="ghost" type="button" onClick={closeTeleconsultRoom}>Close</button>
        </div>

        <div className="teleconsult-room-grid">
          <div className="teleconsult-room-main">
            <div className="history-card">
              <p className="micro">Mode: {normalizedMode || "-"}</p>
              <p className="micro">Phone: {consult.phone || "-"}</p>
              <p className="micro">Concern: {consult.concern || "-"}</p>
            </div>

            {normalizedMode === "audio" ? (
              <AudioConsultPanel
                consult={consult}
                consentAccepted={patientConsentAccepted}
                roomReady={roomReady}
              />
            ) : ["video"].includes(normalizedMode) ? (
              <div className="history-card subtle">
                <p className="micro strong">Video consult is coming soon.</p>
                <p className="micro">This consult request is saved in the system, but live video is still disabled while the calling layer is being rebuilt properly.</p>
              </div>
            ) : null}

            <div className="teleconsult-chat-card">
              <div className="section-head compact">
                <div>
                  <p className="micro strong">Consult chat</p>
                  <p className="micro">Use this thread for updates, file-free instructions, and quick coordination.</p>
                </div>
              </div>
              {!patientConsentAccepted ? (
                <div className="history-card subtle">
                  <p className="micro strong">Teleconsult notice</p>
                  <p className="micro">This remote consult is general app-based care support and does not replace emergency treatment or in-person care when urgently needed.</p>
                  <div className="action-row">
                    <button className="secondary" type="button" onClick={acceptConsultConsent}>
                      I understand
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="consult-thread">
                {consultMessages.length === 0 ? (
                  <p className="micro">No messages yet.</p>
                ) : (
                  consultMessages.map((msg) => (
                    <div
                      key={`consult-msg-${msg.id}`}
                      className={`chat-msg ${msg.senderRole === "patient" ? "user" : "bot"}`}
                    >
                      <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                      <p>{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-form" onSubmit={sendConsultMessage}>
                <input
                  type="text"
                  value={consultMessageText}
                  placeholder={normalizedMode === "chat" ? "Type your message to the doctor..." : "Send a quick message to the consult room..."}
                  disabled={!patientConsentAccepted}
                  onChange={(event) => setConsultMessageText(event.target.value)}
                />
                <button className="primary" type="submit" disabled={!patientConsentAccepted}>Send</button>
              </form>
              {consultMessageStatus ? <p className="micro">{consultMessageStatus}</p> : null}
            </div>
          </div>

          <aside className="teleconsult-room-side">
            <div className="history-card">
              <p className="mini-label">Session status</p>
              <h3>{teleStatusLabel(consult.status) || consult.status}</h3>
              <p className="micro">
                {normalizedMode === "chat"
                  ? "Stay on this screen for the live chat consult."
                  : normalizedMode === "audio"
                    ? "Stay here for the live audio consult and use chat for backup if the call drops."
                    : "Video is temporarily disabled and will return once the live calling layer is rebuilt."}
              </p>
              <p className="micro">
                {patientConsentAccepted
                  ? `Teleconsult notice accepted ${consultConsentSummary?.patientAcceptedAt ? `at ${new Date(consultConsentSummary.patientAcceptedAt).toLocaleString()}` : ""}.`
                  : "Teleconsult notice pending."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
