import { useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useDebounce, useFetch } from "../../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Loading, PageHeader } from "../../components/ui.jsx";
import { DEPARTMENTS } from "../../constants.js";

export default function AdminStudents() {
  const toast = useToast();
  const [filters, setFilters] = useState({ q: "", department: "", status: "" });
  const q = useDebounce(filters.q);
  const { data, loading, error, reload } = useFetch("/admin/users", { role: "student", ...filters, q });
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const rows = data?.users || [];

  const setStatus = async (u, status) => {
    try {
      await api.patch(`/admin/users/${u._id}/status`, { status });
      toast.success(status === "blocked" ? "Student blocked" : "Student unblocked");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name} and all their applications? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast.success("Student deleted");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Students" subtitle={`${rows.length} student${rows.length === 1 ? "" : "s"} shown`} />
      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search name, email or roll number" value={filters.q} onChange={set("q")} />
        </div>
        <select className="input" value={filters.department} onChange={set("department")} aria-label="Department">
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select className="input" value={filters.status} onChange={set("status")} aria-label="Status">
          <option value="">All statuses</option>
          <option value="approved">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll no.</th>
                <th>Department</th>
                <th>CGPA</th>
                <th>Resume</th>
                <th>Placement</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={u.name} size={32} />
                      <div>
                        <strong>{u.name}</strong>
                        <small>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{u.student?.rollNo}</td>
                  <td>{u.student?.department}</td>
                  <td>{u.student?.cgpa ?? "-"}</td>
                  <td>
                    {u.student?.resume?.url ? (
                      <a className="link" href={u.student.resume.url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      <span className="text-muted">Missing</span>
                    )}
                  </td>
                  <td>{u.placedAt ? <Badge status="selected">{u.placedAt}</Badge> : <span className="text-muted">Not placed</span>}</td>
                  <td>
                    <Badge status={u.status} />
                  </td>
                  <td className="right">
                    <div className="btn-row end">
                      {u.status === "blocked" ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(u, "approved")}>
                          Unblock
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(u, "blocked")}>
                          Block
                        </button>
                      )}
                      <button className="btn btn-sm btn-ghost danger" onClick={() => remove(u)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={GraduationCap} title="No students found" />
      )}
    </>
  );
}
