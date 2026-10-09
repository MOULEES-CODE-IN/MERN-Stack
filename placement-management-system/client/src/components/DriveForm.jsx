import { useState } from "react";
import { Field } from "./ui.jsx";
import { useForm } from "../hooks.js";
import { DEPARTMENTS, JOB_TYPES } from "../constants.js";
import { toInputDate } from "../utils.js";

export default function DriveForm({ drive, onSubmit, onCancel }) {
  const { values, set, bind } = useForm({
    title: drive?.title || "",
    jobType: drive?.jobType || "Full-time",
    location: drive?.location || "",
    ctc: drive?.ctc ?? "",
    openings: drive?.openings ?? 1,
    minCgpa: drive?.minCgpa ?? 0,
    departments: drive?.departments || [],
    skills: (drive?.skills || []).join(", "),
    deadline: toInputDate(drive?.deadline),
    driveDate: toInputDate(drive?.driveDate),
    description: drive?.description || "",
  });
  const [busy, setBusy] = useState(false);

  const toggleDept = (d) =>
    set("departments", values.departments.includes(d) ? values.departments.filter((x) => x !== d) : [...values.departments, d]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form-grid">
      <Field label="Job title" full>
        <input className="input" required {...bind("title")} placeholder="e.g. Associate Software Engineer" />
      </Field>
      <Field label="Job type">
        <select className="input" {...bind("jobType")}>
          {JOB_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Location">
        <input className="input" {...bind("location")} placeholder="Chennai / Remote" />
      </Field>
      <Field label="Package (LPA)">
        <input className="input" type="number" min="0" step="0.1" required {...bind("ctc")} />
      </Field>
      <Field label="Openings">
        <input className="input" type="number" min="1" required {...bind("openings")} />
      </Field>
      <Field label="Minimum CGPA">
        <input className="input" type="number" min="0" max="10" step="0.1" {...bind("minCgpa")} />
      </Field>
      <Field label="Application deadline">
        <input className="input" type="date" required {...bind("deadline")} />
      </Field>
      <Field label="Drive date" hint="Optional">
        <input className="input" type="date" {...bind("driveDate")} />
      </Field>
      <Field label="Required skills" hint="Separate with commas" full>
        <input className="input" {...bind("skills")} placeholder="React, Node.js, SQL" />
      </Field>
      <div className="field field-full">
        <span>Eligible departments</span>
        <div className="check-row">
          {DEPARTMENTS.map((d) => (
            <label key={d} className={`check-pill ${values.departments.includes(d) ? "on" : ""}`}>
              <input type="checkbox" checked={values.departments.includes(d)} onChange={() => toggleDept(d)} />
              {d}
            </label>
          ))}
        </div>
        <small>Leave all unselected to open the drive to every department.</small>
      </div>
      <Field label="Job description" full>
        <textarea className="input" rows={5} required {...bind("description")} placeholder="Role, responsibilities, selection rounds…" />
      </Field>
      <div className="form-actions field-full">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : drive ? "Save changes" : "Submit for approval"}
        </button>
      </div>
    </form>
  );
}
