import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, Clock, GraduationCap, IndianRupee, Info, MapPin, Users } from "lucide-react";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useFetch } from "../hooks.js";
import { Avatar, Badge, ErrorBox, Loading, Section } from "../components/ui.jsx";
import { cname, daysLeft, fmtDate } from "../utils.js";

function ApplyPanel({ drive, reload }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { eligibility, applicationStatus } = drive;

  const apply = async () => {
    setBusy(true);
    try {
      await api.post(`/applications/drive/${drive._id}`, { coverNote: note });
      toast.success("Application submitted");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (applicationStatus) {
    return (
      <Section title="Your application">
        <div className="apply-state">
          <Badge status={applicationStatus} />
          <p className="text-muted">You have applied to this drive. Track progress from My applications.</p>
          <Link className="btn btn-ghost btn-block" to="/applications">
            Open my applications
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Apply to this drive">
      {eligibility.eligible ? (
        <>
          <div className="alert alert-ok">
            <Check size={16} /> You meet every requirement for this drive.
          </div>
          <label className="field">
            <span>Note to the recruiter (optional)</span>
            <textarea className="input" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-block" onClick={apply} disabled={busy}>
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </>
      ) : (
        <>
          <div className="alert alert-warn">
            <Info size={16} />
            <div>
              <strong>You cannot apply yet</strong>
              <ul className="plain-list">
                {eligibility.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          {eligibility.reasons.some((r) => r.toLowerCase().includes("resume")) && (
            <Link className="btn btn-primary btn-block" to="/resume">
              Upload resume
            </Link>
          )}
        </>
      )}
    </Section>
  );
}

function AdminPanel({ drive, reload }) {
  const toast = useToast();
  const [remark, setRemark] = useState("");
  const set = async (status) => {
    try {
      await api.patch(`/drives/${drive._id}/status`, { status, remark });
      toast.success(`Drive ${status}`);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <Section title="Admin review">
      <p>
        Current status: <Badge status={drive.status} />
      </p>
      <label className="field">
        <span>Remark for the company (used when rejecting)</span>
        <textarea className="input" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} />
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => set("approved")} disabled={drive.status === "approved"}>
          Approve
        </button>
        <button className="btn btn-danger" onClick={() => set("rejected")} disabled={drive.status === "rejected"}>
          Reject
        </button>
        <button className="btn btn-ghost" onClick={() => set("closed")} disabled={drive.status === "closed"}>
          Close
        </button>
      </div>
    </Section>
  );
}

export default function DriveDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/drives/${id}`);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const drive = data.drive;
  const left = daysLeft(drive.deadline);

  return (
    <>
      <button className="link back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="detail-head card">
        <Avatar name={cname(drive.company)} size={56} />
        <div className="grow">
          <h1>{drive.title}</h1>
          <p className="text-muted">
            {cname(drive.company)} {drive.company?.company?.industry ? `· ${drive.company.company.industry}` : ""}
          </p>
          <div className="chips">
            <span className="chip"><IndianRupee size={13} /> {drive.ctc} LPA</span>
            <span className="chip"><MapPin size={13} /> {drive.location}</span>
            <span className="chip">{drive.jobType}</span>
            <span className="chip"><Users size={13} /> {drive.openings} opening{drive.openings === 1 ? "" : "s"}</span>
            {user.role !== "student" && <Badge status={drive.status} />}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack">
          <Section title="About the role">
            <p className="prose">{drive.description}</p>
          </Section>
          <Section title="Requirements">
            <dl className="facts">
              <div><dt><GraduationCap size={15} /> Minimum CGPA</dt><dd>{drive.minCgpa || "No minimum"}</dd></div>
              <div><dt>Departments</dt><dd>{drive.departments?.length ? drive.departments.join(", ") : "All departments"}</dd></div>
              <div><dt><Clock size={15} /> Apply by</dt><dd>{fmtDate(drive.deadline)} {left > 0 && <span className="text-muted">({left} days left)</span>}</dd></div>
              {drive.driveDate && <div><dt><CalendarDays size={15} /> Drive date</dt><dd>{fmtDate(drive.driveDate)}</dd></div>}
            </dl>
            {drive.skills?.length > 0 && (
              <div className="skills">
                {drive.skills.map((s) => (
                  <span key={s} className="skill">{s}</span>
                ))}
              </div>
            )}
          </Section>
          {drive.company?.company?.about && (
            <Section title={`About ${cname(drive.company)}`}>
              <p className="prose">{drive.company.company.about}</p>
            </Section>
          )}
        </div>

        <div className="stack">
          {user.role === "student" && <ApplyPanel drive={drive} reload={reload} />}
          {user.role === "admin" && <AdminPanel drive={drive} reload={reload} />}
          {user.role === "company" && (
            <Section title="Applicants">
              <p className="text-muted">{drive.applicants} student{drive.applicants === 1 ? " has" : "s have"} applied.</p>
              {drive.status === "rejected" && drive.adminRemark && <div className="alert alert-warn">Admin remark: {drive.adminRemark}</div>}
              <Link className="btn btn-primary btn-block" to={`/applicants?drive=${drive._id}`}>
                View applicants
              </Link>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
