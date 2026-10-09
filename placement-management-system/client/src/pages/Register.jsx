import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../api.js";
import { useForm } from "../hooks.js";
import { Field, Tabs } from "../components/ui.jsx";
import { DEPARTMENTS } from "../constants.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const { values, bind } = useForm({
    name: "", email: "", phone: "", password: "",
    rollNo: "", department: DEPARTMENTS[0], batch: new Date().getFullYear(), cgpa: "",
    companyName: "", industry: "", location: "", website: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await register({ ...values, role });
      if (data.pending) setSubmitted(data.message);
      else navigate("/");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-single">
        <div className="auth-card center">
          <span className="success-mark">
            <Check size={26} />
          </span>
          <h2>Request received</h2>
          <p className="text-muted">{submitted}</p>
          <Link className="btn btn-primary" to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-single">
      <form className="auth-card wide" onSubmit={submit}>
        <div className="brand dark">
          <span className="brand-mark">
            <Briefcase size={18} />
          </span>
          <strong>Placement Cell</strong>
        </div>
        <h2>Create your account</h2>
        <Tabs value={role} onChange={setRole} items={[["student", "I am a student"], ["company", "I represent a company"]]} />
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <Field label={role === "student" ? "Full name" : "Contact person"}>
            <input className="input" required {...bind("name")} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" required {...bind("email")} />
          </Field>
          <Field label="Phone">
            <input className="input" {...bind("phone")} />
          </Field>
          <Field label="Password" hint="At least 6 characters">
            <input className="input" type="password" minLength={6} required {...bind("password")} />
          </Field>

          {role === "student" ? (
            <>
              <Field label="Roll number">
                <input className="input" required {...bind("rollNo")} />
              </Field>
              <Field label="Department">
                <select className="input" {...bind("department")}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Batch (passing year)">
                <input className="input" type="number" {...bind("batch")} />
              </Field>
              <Field label="Current CGPA">
                <input className="input" type="number" min="0" max="10" step="0.01" {...bind("cgpa")} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Company name">
                <input className="input" required {...bind("companyName")} />
              </Field>
              <Field label="Industry">
                <input className="input" {...bind("industry")} placeholder="Software, Core, BPO…" />
              </Field>
              <Field label="Location">
                <input className="input" {...bind("location")} />
              </Field>
              <Field label="Website">
                <input className="input" {...bind("website")} placeholder="https://" />
              </Field>
            </>
          )}
        </div>

        {role === "company" && <div className="alert alert-info">Company accounts are activated after the placement officer approves them.</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
