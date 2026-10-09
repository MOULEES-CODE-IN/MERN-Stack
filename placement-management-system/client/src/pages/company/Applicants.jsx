import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search, Users } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useDebounce, useFetch } from "../../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader } from "../../components/ui.jsx";
import { APPLICATION_STATUSES, DEPARTMENTS } from "../../constants.js";
import { fmtDate, fmtDateTime } from "../../utils.js";

function ReviewModal({ app, onClose, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState(app.status === "applied" ? "shortlisted" : app.status);
  const [note, setNote] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [busy, setBusy] = useState(false);
  const s = app.student;
  const info = s.student;

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/applications/${app._id}/status`, { status, note, interviewDate: status === "interview" ? interviewDate : undefined });
      toast.success(`Marked as ${status}`);
      onSaved();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Review applicant" wide>
      <div className="review">
        <div>
          <div className="review-head">
            <Avatar name={s.name} size={48} />
            <div>
              <h3>{s.name}</h3>
              <p className="text-muted">
                {info.department} · Roll {info.rollNo} · CGPA {info.cgpa ?? "-"}
              </p>
            </div>
          </div>
          <dl className="facts">
            <div><dt>Applied for</dt><dd>{app.drive?.title}</dd></div>
            <div><dt>Applied on</dt><dd>{fmtDate(app.createdAt)}</dd></div>
            <div><dt>Email</dt><dd>{s.email}</dd></div>
            <div><dt>Phone</dt><dd>{s.phone || "-"}</dd></div>
            <div><dt>Backlogs</dt><dd>{info.backlogs ?? 0}</dd></div>
          </dl>
          {info.skills?.length > 0 && (
            <div className="skills">
              {info.skills.map((k) => (
                <span className="skill" key={k}>{k}</span>
              ))}
            </div>
          )}
          {info.about && <p className="prose">{info.about}</p>}
          {app.coverNote && (
            <p className="quote">
              <strong>Note from student</strong>
              <br />
              {app.coverNote}
            </p>
          )}
          <div className="btn-row">
            {info.resume?.url && (
              <a className="btn btn-sm btn-ghost" href={info.resume.url} target="_blank" rel="noreferrer">
                <Download size={14} /> Resume
              </a>
            )}
            {info.linkedin && <a className="btn btn-sm btn-ghost" href={info.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
            {info.github && <a className="btn btn-sm btn-ghost" href={info.github} target="_blank" rel="noreferrer">GitHub</a>}
          </div>
        </div>

        <div className="review-side">
          <h4>Update status</h4>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {APPLICATION_STATUSES.filter((x) => x !== "applied").map((x) => (
                <option key={x} value={x}>
                  {x[0].toUpperCase() + x.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          {status === "interview" && (
            <Field label="Interview date and time">
              <input className="input" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            </Field>
          )}
          <Field label="Message to the student" hint="Shown in their application timeline">
            <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save status"}
          </button>

          <h4>History</h4>
          <ol className="timeline small">
            {app.timeline.map((t, i) => (
              <li key={i}>
                <Badge status={t.status} />
                <div>
                  <small>{fmtDateTime(t.at)}</small>
                  {t.note && <p>{t.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}

export default function CompanyApplicants() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ drive: params.get("drive") || "", status: "", department: "", q: "" });
  const q = useDebounce(filters.q);
  const drives = useFetch("/drives");
  const { data, loading, error, reload } = useFetch("/applications/received", { ...filters, q });
  const [review, setReview] = useState(null);

  const set = (k) => (e) => {
    setFilters({ ...filters, [k]: e.target.value });
    if (k === "drive") setParams(e.target.value ? { drive: e.target.value } : {});
  };
  const apps = data?.applications || [];

  return (
    <>
      <PageHeader title="Applicants" subtitle="Review students, shortlist them and move them through your rounds." />
      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search by name, roll number or skill" value={filters.q} onChange={set("q")} />
        </div>
        <select className="input" value={filters.drive} onChange={set("drive")} aria-label="Drive">
          <option value="">All drives</option>
          {(drives.data?.drives || []).map((d) => (
            <option key={d._id} value={d._id}>
              {d.title}
            </option>
          ))}
        </select>
        <select className="input" value={filters.status} onChange={set("status")} aria-label="Status">
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select className="input" value={filters.department} onChange={set("department")} aria-label="Department">
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : apps.length ? (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Drive</th>
                <th>Department</th>
                <th>CGPA</th>
                <th>Applied</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={a.student.name} size={32} />
                      <div>
                        <strong>{a.student.name}</strong>
                        <small>{a.student.student.rollNo}</small>
                      </div>
                    </div>
                  </td>
                  <td>{a.drive?.title}</td>
                  <td>{a.student.student.department}</td>
                  <td>{a.student.student.cgpa ?? "-"}</td>
                  <td>{fmtDate(a.createdAt)}</td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td className="right">
                    <button className="btn btn-sm btn-primary" onClick={() => setReview(a)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={Users} title="No applicants found" text="Applicants appear here once students apply to your approved drives." />
      )}

      {review && (
        <ReviewModal
          app={review}
          onClose={() => setReview(null)}
          onSaved={() => {
            setReview(null);
            reload();
          }}
        />
      )}
    </>
  );
}
