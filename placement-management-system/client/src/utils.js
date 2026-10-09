export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "-";

export const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

// value for <input type="date"> using the local calendar day
export const toInputDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const cname = (u) => u?.company?.companyName || u?.name || "Company";

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const profileScore = (user) => {
  const s = user.student || {};
  const checks = [
    [!!user.phone, "Add your phone number", "/profile"],
    [s.cgpa !== undefined && s.cgpa !== null, "Add your CGPA", "/profile"],
    [(s.skills || []).length > 0, "List your skills", "/profile"],
    [!!s.about, "Write a short summary about yourself", "/profile"],
    [!!(s.linkedin || s.github), "Add a LinkedIn or GitHub link", "/profile"],
    [!!(s.resume && s.resume.url), "Upload your resume", "/resume"],
  ];
  const done = checks.filter((c) => c[0]).length;
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c[0]).map((c) => ({ label: c[1], to: c[2] })),
  };
};

export const downloadCsv = (filename, rows) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
