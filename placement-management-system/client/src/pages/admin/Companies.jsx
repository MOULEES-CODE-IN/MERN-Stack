import { useState } from "react";
import { Building2, Search } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useDebounce, useFetch } from "../../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Loading, PageHeader, Tabs } from "../../components/ui.jsx";
import { fmtDate } from "../../utils.js";

export default function AdminCompanies() {
  const toast = useToast();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const search = useDebounce(q);
  const { data, loading, error, reload } = useFetch("/admin/users", { role: "company", q: search });

  const all = data?.users || [];
  const count = (s) => all.filter((u) => u.status === s).length;
  const rows = tab === "all" ? all : all.filter((u) => u.status === tab);

  const setStatus = async (u, status, message) => {
    try {
      await api.patch(`/admin/users/${u._id}/status`, { status });
      toast.success(message);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.company?.companyName} with all its drives and applications? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast.success("Company deleted");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Companies" subtitle="Approve new companies before they can sign in." />
      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search company, contact or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[["pending", "Pending", count("pending")], ["approved", "Approved", count("approved")], ["rejected", "Rejected", count("rejected")], ["blocked", "Blocked", count("blocked")], ["all", "All", all.length]]}
      />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Industry</th>
                <th>Registered</th>
                <th>Drives</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={u.company?.companyName} size={32} />
                      <div>
                        <strong>{u.company?.companyName}</strong>
                        <small>{u.company?.location}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.name}
                    <small className="block">{u.email}</small>
                  </td>
                  <td>{u.company?.industry || "-"}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{u.driveCount}</td>
                  <td>
                    <Badge status={u.status} />
                  </td>
                  <td className="right">
                    <div className="btn-row end">
                      {(u.status === "pending" || u.status === "rejected") && (
                        <button className="btn btn-sm btn-primary" onClick={() => setStatus(u, "approved", "Company approved")}>
                          Approve
                        </button>
                      )}
                      {u.status === "pending" && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(u, "rejected", "Company rejected")}>
                          Reject
                        </button>
                      )}
                      {u.status === "approved" && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(u, "blocked", "Company blocked")}>
                          Block
                        </button>
                      )}
                      {u.status === "blocked" && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(u, "approved", "Company unblocked")}>
                          Unblock
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
        <Empty icon={Building2} title={`No ${tab === "all" ? "" : tab + " "}companies`} text="New company registrations will appear here." />
      )}
    </>
  );
}
