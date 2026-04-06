export function ReportsPanel({
  records,
  reportExtractionCapabilities,
  reportInsightsStatus,
  openRecordUploader,
  seedDemoReports,
  isLocalDemoHost,
  recordsInputRef,
  uploadRecord,
  recordStatus,
  downloadRecord,
  deleteRecord,
  t,
}) {
  const latestRecordDate = records[0]?.created_at ? new Date(records[0].created_at).toLocaleDateString() : "-";

  return (
    <section className="panel">
      <div className="report-shell-hero">
        <div>
          <p className="eyebrow">Lab reports</p>
          <h2>Upload and keep your lab reports ready</h2>
          <p className="panel-sub">Add clear PDF or image reports so they are available during visits and follow-ups.</p>
        </div>
        <div className="report-shell-stats">
          <article className="report-shell-stat">
            <span className="mini-label">Reports</span>
            <strong>{records.length}</strong>
            <span className="micro">Uploaded to your health record</span>
          </article>
          <article className="report-shell-stat">
            <span className="mini-label">Latest upload</span>
            <strong>{latestRecordDate}</strong>
            <span className="micro">Most recent lab document</span>
          </article>
        </div>
      </div>

      <div className="report-insights-topbar">
        <div className="action-row">
          <button type="button" className="primary" onClick={openRecordUploader}>
            Upload your lab reports
          </button>
          {isLocalDemoHost ? (
            <button type="button" className="secondary" onClick={seedDemoReports}>
              Load demo reports
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={recordsInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={uploadRecord}
        style={{ display: "none" }}
      />

      {recordStatus ? <p className="micro">{recordStatus}</p> : null}
      {reportInsightsStatus ? <p className="micro">{reportInsightsStatus}</p> : null}

      {reportExtractionCapabilities ? (
        <p className="micro report-support-note">
          Auto-detect on this server:{" "}
          {reportExtractionCapabilities.pdftotext || reportExtractionCapabilities.swiftVisionOcr ? "PDF supported" : "PDF extractor unavailable"}
          {" • "}
          {reportExtractionCapabilities.tesseract || reportExtractionCapabilities.swiftVisionOcr ? "Image OCR supported" : "Image OCR unavailable"}
        </p>
      ) : null}

      <p className="micro report-support-note">
        Supported uploads: clear PDF reports or sharp images. Blurry, dark, or unsupported report formats will be rejected.
      </p>

      <div className="history-list">
        {records.length === 0 ? (
          <p className="micro">No reports uploaded yet.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="history-card report-record-card">
              <div className="report-record-head">
                <div>
                  <p className="history-headline">{record.file_name || `Report #${record.id}`}</p>
                  <p className="micro">
                    {record.created_at ? new Date(record.created_at).toLocaleString() : "-"}
                    {record.mimetype ? ` • ${record.mimetype}` : ""}
                  </p>
                </div>
              </div>
              <div className="action-row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => downloadRecord?.(record.id, record.file_name || "report")}
                >
                  Download
                </button>
                <button type="button" className="ghost" onClick={() => deleteRecord(record.id)}>
                  {t("removeRecord")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
