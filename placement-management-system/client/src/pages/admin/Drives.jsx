import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Search } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useDebounce, useFetch } from "../../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Tabs } from "../../components/ui.jsx";
import { cname, fmtDate } from "../../utils.js";

export default function AdminDrives() {
  const toast = useToast();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const search = useDebounce(q);
  const { data, loading, error, reload } = useFetch("/drives", { q: search });
  const [rejecting, setRejecting] = useState(null);
  const [remark, setRemark] = useState("");

  const all = data?.drives || [];
  const count = (s) => all.filter((d) => d.status === s).length;
  const rows = tab === "all" ? all : all.filter((d) => d.status === tab);

  const setStatus = async (d, status, extra = {}) => {
    try {
      await api.patch(`/drives/${d._id}/status`, { status, ...extra });
      toast.success(`Drive ${status}`);
      setRejecting(null);
      setRemark("");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Drive approvals" subtitle="Drives become visible to students only after you approve them." />
      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search by role, company or skill" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[["pending", "Pending", count("pending")], ["approved", "Approved", count("approved")], ["rejected", "Rejected", count("rejected")], ["closed", "Closed", count("closed")], ["all", "All", all.length]]}
      />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : rows.length ? (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Drive</th>
                <th>Package</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d._id}>
                  <td>
                    <div className="cell-user">
                      <Avatar name={cname(d.company)} size={32} />
                      <div>
                        <Link to={`/drives/${d._id}`}>
                          <strong>{d.title}</strong>
                        </Link>
                        <small>{cname(d.company)}</small>
                      </div>
                    </div>
                  </td>
                  <td>{d.ctc} LPA</td>
                  <td>{fmtDate(d.deadline)}</td>
                  <td>{d.applicants}</td>
                  <td>
                    <Badge status={d.status} />
                  </td>
                  <td className="right">
                    <div className="btn-row end">
                      {d.status !== "approved" && d.status !== "closed" && (
                        <button className="btn btn-sm btn-primary" onClick={() => setStatus(d, "approved")}>
                          Approve
                        </button>
                      )}
                      {d.status === "pending" && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setRejecting(d)}>
                          Reject
                        </button>
                      )}
                      {d.status === "approved" && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setStatus(d, "closed")}>
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={ClipboardCheck} title={`No ${tab === "all" ? "" : tab + " "}drives`} text="Nothing to review here right now." />
      )}

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Reject "${rejecting?.title}"`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRejecting(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => setStatus(rejecting, "rejected", { remark })}>
              Reject drive
            </button>
          </>
        }
      >
        <Field label="Reason for the company" hint="The company sees this and can edit and resubmit the drive.">
          <textarea className="input" rows={4} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
