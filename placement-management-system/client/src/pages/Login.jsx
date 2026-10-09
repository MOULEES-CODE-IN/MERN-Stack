import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../api.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand">
          <span className="brand-mark">
            <Briefcase size={18} />
          </span>
          <strong>Placement Cell</strong>
        </div>
        <div>
          <h1>Campus hiring, from application to offer.</h1>
          <ul className="auth-points">
            <li>
              <GraduationCap size={18} /> Students browse drives, apply and track every round.
            </li>
            <li>
              <Building2 size={18} /> Companies post openings and shortlist applicants.
            </li>
            <li>
              <ShieldCheck size={18} /> The placement officer approves companies and drives, and reports results.
            </li>
          </ul>
        </div>
        <small>Placement Management System</small>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="text-muted">Use the email you registered with.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
          <button type="button" className="demo-hint" onClick={() => setForm({ email: "admin@college.edu", password: "Admin@123" })}>
            Setting up? Fill the default admin login
          </button>
        </form>
      </main>
    </div>
  );
}
