export function LegacyPublicInfoSection(props) {
  const {
    t,
    formatNumber,
    liveStats,
    showDisclaimer,
    acceptDisclaimer,
    chatOpen,
    setChatOpen,
    chatMessages,
    chatLoading,
    sendChatMessage,
    chatInput,
    setChatInput,
  } = props;

  return (
    <>
      <section className="trust">
        <div className="trust-header">
          <h2>{t("trustTitle")}</h2>
          <p>{t("howDecideBody")}</p>
        </div>
        <div className="trust-grid">
          <div className="trust-card">
            <h3>{t("trustCard1")}</h3>
            <p>{t("trustCard1Desc")}</p>
          </div>
          <div className="trust-card">
            <h3>{t("trustCard2")}</h3>
            <p>{t("trustCard2Desc")}</p>
          </div>
          <div className="trust-card">
            <h3>{t("trustCard3")}</h3>
            <p>{t("trustCard3Desc")}</p>
          </div>
        </div>
      </section>

      <section className="proof">
        <div>
          <h2>{t("proofTitle")}</h2>
          <p className="micro">{t("proofLiveNote")}</p>
        </div>
        <div className="proof-grid">
          <div className="proof-card">
            <p className="proof-metric">{formatNumber(liveStats.users)}</p>
            <p className="proof-label">{t("proofUsersLabel")}</p>
          </div>
          <div className="proof-card">
            <p className="proof-metric">{formatNumber(liveStats.triageCompleted)}</p>
            <p className="proof-label">{t("proofTriageLabel")}</p>
          </div>
          <div className="proof-card">
            <p className="proof-metric">{formatNumber(liveStats.doctorViews)}</p>
            <p className="proof-label">{t("proofDoctorViewsLabel")}</p>
          </div>
        </div>
      </section>

      <section className="advisors">
        <h2>{t("advisorTitle")}</h2>
        <div className="advisor-grid">
          <div className="advisor-card">
            <div className="avatar">A</div>
            <div>
              <p className="advisor-name">Dr. Ananya Rao</p>
              <p className="micro">{t("advisorRole1")}</p>
            </div>
          </div>
          <div className="advisor-card">
            <div className="avatar">M</div>
            <div>
              <p className="advisor-name">Dr. Mehul Patel</p>
              <p className="micro">{t("advisorRole2")}</p>
            </div>
          </div>
          <div className="advisor-card">
            <div className="avatar">S</div>
            <div>
              <p className="advisor-name">Dr. Sana Qureshi</p>
              <p className="micro">{t("advisorRole3")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel directory" id="doctors">
        <div className="directory-header">
          <h2>{t("directoryTitle")}</h2>
          <p>{t("directoryDesc")}</p>
        </div>
        <div className="directory-grid">
          <div className="directory-card">
            <h3>{t("directoryCard1")}</h3>
            <p>{t("directoryCard1Desc")}</p>
          </div>
          <div className="directory-card">
            <h3>{t("directoryCard2")}</h3>
            <p>{t("directoryCard2Desc")}</p>
          </div>
          <div className="directory-card">
            <h3>{t("directoryCard3")}</h3>
            <p>{t("directoryCard3Desc")}</p>
          </div>
        </div>
        <div className="action-row">
          <a className="secondary" href="/clinic">{t("clinicTitle")}</a>
          <a className="secondary" href="/doctor-dashboard">{t("doctorConsoleOpen")}</a>
        </div>
      </section>

      <section className="info" id="how">
        <div>
          <h2>{t("howTitle")}</h2>
          <p>{t("howBody")}</p>
        </div>
        <div>
          <h2>{t("designedTitle")}</h2>
          <p>{t("designedBody")}</p>
        </div>
        <div>
          <h2>{t("complianceTitle")}</h2>
          <p>{t("complianceBody")}</p>
        </div>
      </section>

      <footer className="footer">
        <p>{t("footer")}</p>
      </footer>

      {showDisclaimer && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{t("disclaimerTitle")}</h2>
            <p>{t("disclaimerBody")}</p>
            <p className="micro">{t("disclaimerConfirm")}</p>
            <button className="primary full" onClick={acceptDisclaimer}>
              {t("disclaimerCta")}
            </button>
          </div>
        </div>
      )}

      <div className={`chat-widget ${chatOpen ? "open" : ""}`}>
        <button type="button" className="chat-toggle" onClick={() => setChatOpen((prev) => !prev)}>
          {t("chatOpen")}
        </button>
        {chatOpen && (
          <div className="chat-panel">
            <p className="chat-title">{t("chatTitle")}</p>
            <div className="chat-body">
              {chatMessages.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className={msg.role === "assistant" ? "chat-msg bot" : "chat-msg user"}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && <p className="micro">{t("chatThinking")}</p>}
            </div>
            <form className="chat-form" onSubmit={sendChatMessage}>
              <input type="text" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={t("chatPlaceholder")} />
              <button type="submit" className="primary">{t("chatSend")}</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
