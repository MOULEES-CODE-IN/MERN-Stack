import { useState } from "react";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks.js";
import { Field, PageHeader, Section } from "../components/ui.jsx";
import { DEPARTMENTS } from "../constants.js";

function PasswordCard() {
  const toast = useToast();
  const { values, setValues, bind } = useForm({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/auth/password", values);
      toast.success("Password updated");
      setValues({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Change password">
      <form onSubmit={submit} className="form-grid">
        <Field label="Current password">
          <input className="input" type="password" required {...bind("currentPassword")} />
        </Field>
        <Field label="New password" hint="At least 6 characters">
          <input className="input" type="password" minLength={6} required {...bind("newPassword")} />
        </Field>
        <div className="form-actions field-full">
          <button className="btn btn-primary" disabled={busy}>
            Update password
          </button>
        </div>
      </form>
    </Section>
  );
}

function useSave() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const save = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.put("/profile", payload);
      updateUser(data.user);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return { save, busy };
}

function StudentProfile({ user }) {
  const s = user.student || {};
  const { save, busy } = useSave();
  const { values, bind } = useForm({
    name: user.name, phone: user.phone || "",
    rollNo: s.rollNo || "", department: s.department || DEPARTMENTS[0], batch: s.batch ?? "", cgpa: s.cgpa ?? "", backlogs: s.backlogs ?? 0,
    skills: (s.skills || []).join(", "), about: s.about || "", linkedin: s.linkedin || "", github: s.github || "",
  });

  const submit = (e) => {
    e.preventDefault();
    const { name, phone, ...student } = values;
    save({ name, phone, student });
  };

  return (
    <>
      <PageHeader title="Your profile" subtitle="Companies review this information when you apply." />
      <Section title="Personal and academic details">
        <form onSubmit={submit} className="form-grid">
          <Field label="Full name">
            <input className="input" required {...bind("name")} />
          </Field>
          <Field label="Email" hint="Email cannot be changed">
            <input className="input" value={user.email} disabled readOnly />
          </Field>
          <Field label="Phone">
            <input className="input" {...bind("phone")} />
          </Field>
          <Field label="Roll number">
            <input className="input" {...bind("rollNo")} />
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
          <Field label="CGPA">
            <input className="input" type="number" min="0" max="10" step="0.01" {...bind("cgpa")} />
          </Field>
          <Field label="Current backlogs">
            <input className="input" type="number" min="0" {...bind("backlogs")} />
          </Field>
          <Field label="Skills" hint="Separate with commas" full>
            <input className="input" {...bind("skills")} placeholder="React, Node.js, SQL" />
          </Field>
          <Field label="About you" hint="Up to 600 characters" full>
            <textarea className="input" rows={4} maxLength={600} {...bind("about")} />
          </Field>
          <Field label="LinkedIn URL">
            <input className="input" {...bind("linkedin")} />
          </Field>
          <Field label="GitHub URL">
            <input className="input" {...bind("github")} />
          </Field>
          <div className="form-actions field-full">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </Section>
      <PasswordCard />
    </>
  );
}

function CompanyProfile({ user }) {
  const c = user.company || {};
  const { save, busy } = useSave();
  const { values, bind } = useForm({
    name: user.name, phone: user.phone || "",
    companyName: c.companyName || "", industry: c.industry || "", location: c.location || "",
    website: c.website || "", size: c.size || "", about: c.about || "",
  });

  const submit = (e) => {
    e.preventDefault();
    const { name, phone, ...company } = values;
    save({ name, phone, company });
  };

  return (
    <>
      <PageHeader title="Company profile" subtitle="Students see these details on your drives." />
      <Section title="Company details">
        <form onSubmit={submit} className="form-grid">
          <Field label="Company name">
            <input className="input" required {...bind("companyName")} />
          </Field>
          <Field label="Industry">
            <input className="input" {...bind("industry")} />
          </Field>
          <Field label="Location">
            <input className="input" {...bind("location")} />
          </Field>
          <Field label="Company size">
            <input className="input" {...bind("size")} placeholder="e.g. 200-500" />
          </Field>
          <Field label="Website">
            <input className="input" {...bind("website")} />
          </Field>
          <Field label="Contact person">
            <input className="input" required {...bind("name")} />
          </Field>
          <Field label="Contact email" hint="Email cannot be changed">
            <input className="input" value={user.email} disabled readOnly />
          </Field>
          <Field label="Contact phone">
            <input className="input" {...bind("phone")} />
          </Field>
          <Field label="About the company" full>
            <textarea className="input" rows={5} maxLength={800} {...bind("about")} />
          </Field>
          <div className="form-actions field-full">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save company profile"}
            </button>
          </div>
        </form>
      </Section>
      <PasswordCard />
    </>
  );
}

function AdminAccount({ user }) {
  const { save, busy } = useSave();
  const { values, bind } = useForm({ name: user.name, phone: user.phone || "" });
  return (
    <>
      <PageHeader title="Account" />
      <Section title="Your details">
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            save(values);
          }}
        >
          <Field label="Name">
            <input className="input" required {...bind("name")} />
          </Field>
          <Field label="Email">
            <input className="input" value={user.email} disabled readOnly />
          </Field>
          <Field label="Phone">
            <input className="input" {...bind("phone")} />
          </Field>
          <div className="form-actions field-full">
            <button className="btn btn-primary" disabled={busy}>
              Save
            </button>
          </div>
        </form>
      </Section>
      <PasswordCard />
    </>
  );
}

export default function Profile() {
  const { user } = useAuth();
  if (user.role === "student") return <StudentProfile user={user} />;
  if (user.role === "company") return <CompanyProfile user={user} />;
  return <AdminAccount user={user} />;
}
