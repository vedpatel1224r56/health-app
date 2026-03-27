export function OverviewWorkspace({ opsStatus, opsData, dashboardCards }) {
  const upcomingCount = opsData?.upcomingAppointments?.length || 0
  const busiestDepartment = opsData?.departmentLoad?.[0]
  const busiestDoctor = opsData?.doctorLoad?.[0]
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head compact module-intro">
          <div>
            <p className="eyebrow">Operations Pulse</p>
            <h2>Operations overview</h2>
            <p className="panel-sub">Track today's load, movement through queue, and operational pressure in real time.</p>
          </div>
        </div>
        {opsStatus && <p className="micro">{opsStatus}</p>}
        {opsData && (
          <>
            <div className="overview-hero-strip">
              <article className="overview-hero-card">
                <span className="mini-label">Upcoming today</span>
                <strong>{upcomingCount}</strong>
                <span className="micro">Appointments still ahead in the day</span>
              </article>
              <article className="overview-hero-card">
                <span className="mini-label">Top department</span>
                <strong>{busiestDepartment?.department_name || "-"}</strong>
                <span className="micro">{busiestDepartment ? `${busiestDepartment.total} appointments` : "No load data yet"}</span>
              </article>
              <article className="overview-hero-card">
                <span className="mini-label">Top doctor load</span>
                <strong>{busiestDoctor?.doctor_name || "-"}</strong>
                <span className="micro">{busiestDoctor ? `${busiestDoctor.total} appointments` : "No doctor load yet"}</span>
              </article>
            </div>
            <div className="ops-stat-grid">
              {dashboardCards.map((card) => (
                <article key={card.label} className={`ops-stat-card ${card.tone}`}>
                  <span className="mini-label">{card.label}</span>
                  <p className="ops-stat-value">{card.value}</p>
                </article>
              ))}
            </div>
            <div className="grid nested-grid">
              <div className="panel result">
                <h3>Upcoming appointments</h3>
                <div className="history-list">
                  {(opsData.upcomingAppointments || []).map((item) => (
                    <div key={item.id} className="history-card elevated">
                      <p className="history-headline">{item.department_name || 'Department'} • {item.status}</p>
                      <p className="micro">{item.doctor_name ? `Dr. ${item.doctor_name}` : 'Unassigned doctor'}</p>
                      <p className="micro">{item.patient_name}</p>
                      <p className="micro">{new Date(item.scheduled_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel result">
                <h3>Department load today</h3>
                <div className="history-list">
                  {(opsData.departmentLoad || []).map((item, index) => (
                    <div key={`dep-${index}`} className="history-card elevated">
                      <p className="history-headline">{item.department_name}</p>
                      <p className="micro">{item.total} appointments</p>
                    </div>
                  ))}
                  {(opsData.departmentLoad || []).length === 0 && (
                    <p className="micro">No department load yet for today.</p>
                  )}
                </div>
              </div>
              <div className="panel result">
                <h3>Doctor-wise load today</h3>
                <div className="history-list">
                  {(opsData.doctorLoad || []).map((item, index) => (
                    <div key={`doc-${index}`} className="history-card elevated">
                      <p className="history-headline">{item.doctor_name}</p>
                      <p className="micro">{item.total} appointments</p>
                    </div>
                  ))}
                  {(opsData.doctorLoad || []).length === 0 && (
                    <p className="micro">No doctor load yet for today.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
