import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Download, FileText, Trash2, Upload } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { PageHeader, Section } from "../../components/ui.jsx";
import { fmtDate, profileScore } from "../../utils.js";

export default function StudentResume() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const input = useRef();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const resume = user.student?.resume;
  const { score, missing } = profileScore(user);

  const upload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    if (file.size > 2 * 1024 * 1024) return toast.error("File is too large (max 2 MB)");
    const fd = new FormData();
    fd.append("resume", file);
    setBusy(true);
    try {
      const { data } = await api.post("/profile/resume", fd);
      updateUser(data.user);
      toast.success("Resume uploaded");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove your resume? You will not be able to apply until you upload another.")) return;
    try {
      const { data } = await api.delete("/profile/resume");
      updateUser(data.user);
      toast.success("Resume removed");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Resume" subtitle="A PDF resume is required before you can apply to any drive." />

      <div className="detail-grid">
        <div className="stack">
          <Section title={resume ? "Current resume" : "Upload your resume"}>
            {resume && (
              <div className="file-row">
                <FileText size={22} />
                <div className="grow">
                  <strong>{resume.originalName}</strong>
                  <small>Uploaded {fmtDate(resume.uploadedAt)}</small>
                </div>
                <a className="btn btn-sm btn-ghost" href={resume.url} target="_blank" rel="noreferrer">
                  <Download size={14} /> Open
                </a>
                <button className="btn btn-sm btn-ghost danger" onClick={remove}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}

            <div
              className={`dropzone ${drag ? "drag" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                upload(e.dataTransfer.files[0]);
              }}
              onClick={() => input.current.click()}
            >
              <Upload size={26} />
              <strong>{busy ? "Uploading…" : resume ? "Drop a new PDF to replace it" : "Drop your PDF here or click to browse"}</strong>
              <small>PDF only, up to 2 MB</small>
              <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files[0])} />
            </div>
          </Section>

          {resume && (
            <Section title="Preview" flush>
              <iframe className="pdf-frame" title="Resume preview" src={resume.url} />
            </Section>
          )}
        </div>

        <Section title="Profile strength">
          <div className="progress big">
            <span style={{ width: `${score}%` }} />
          </div>
          <p className="text-muted">{score}% complete</p>
          {missing.length ? (
            <ul className="plain-list">
              {missing.map((m) => (
                <li key={m.label}>
                  <Link to={m.to}>{m.label}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="alert alert-ok">
              <Check size={16} /> Your profile is complete.
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
