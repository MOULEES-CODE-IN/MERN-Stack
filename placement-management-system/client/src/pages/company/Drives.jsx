import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CalendarDays, Pencil, Plus, Trash2, Users } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useFetch } from "../../hooks.js";
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader, Tabs } from "../../components/ui.jsx";
import DriveForm from "../../components/DriveForm.jsx";
import { fmtDate } from "../../utils.js";

export default function CompanyDrives() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch("/drives");
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | drive

  if (loading && !data) return <Loading />;
  const all = data?.drives || [];
  const rows = tab === "all" ? all : all.filter((d) => d.status === tab);
  const count = (s) => all.filter((d) => d.status === s).length;

  const save = async (values) => {
    try {
      if (editing === "new") await api.post("/drives", values);
      else await api.put(`/drives/${editing._id}`, values);
      toast.success(editing === "new" ? "Drive submitted for approval" : "Drive updated");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const close = async (d) => {
    if (!window.confirm("Close this drive? Students will no longer be able to apply.")) return;
    try {
      await api.patch(`/drives/${d._id}/status`, { status: "closed" });
      toast.success("Drive closed");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}" and all its applications?`)) return;
    try {
      await api.delete(`/drives/${d._id}`);
      toast.success("Drive deleted");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader
        title="My drives"
        subtitle="New drives go live after the placement officer approves them."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={16} /> Post a drive
          </button>
        }
      />
      <ErrorBox message={error} onRetry={reload} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[["all", "All", all.length], ["pending", "Pending", count("pending")], ["approved", "Live", count("approved")], ["rejected", "Rejected", count("rejected")], ["closed", "Closed", count("closed")]]}
      />

      {rows.length ? (
        <div className="stack">
          {rows.map((d) => (
            <div className="card row-card" key={d._id}>
              <div className="grow">
                <div className="row-title">
                  <Link to={`/drives/${d._id}`}>
                    <h3>{d.title}</h3>
                  </Link>
                  <Badge status={d.status} />
                </div>
                <div className="chips">
                  <span className="chip">{d.ctc} LPA</span>
                  <span className="chip">{d.jobType}</span>
                  <span className="chip">
                    <CalendarDays size={13} /> Apply by {fmtDate(d.deadline)}
                  </span>
                  <span className="chip">
                    <Users size={13} /> {d.applicants} applicant{d.applicants === 1 ? "" : "s"}
                  </span>
                </div>
                {d.status === "rejected" && d.adminRemark && <p className="text-bad">Admin remark: {d.adminRemark}. Edit the drive to resubmit it.</p>}
              </div>
              <div className="btn-row">
                <Link className="btn btn-sm btn-ghost" to={`/applicants?drive=${d._id}`}>
                  Applicants
                </Link>
                <button className="btn btn-sm btn-ghost" onClick={() => setEditing(d)}>
                  <Pencil size={14} /> Edit
                </button>
                {d.status === "approved" && (
                  <button className="btn btn-sm btn-ghost" onClick={() => close(d)}>
                    Close
                  </button>
                )}
                <button className="btn btn-sm btn-ghost danger" onClick={() => remove(d)} aria-label="Delete drive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={Briefcase} title={tab === "all" ? "You have not posted a drive yet" : `No ${tab} drives`} text="Post a drive to start receiving applications from eligible students." />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Post a new drive" : "Edit drive"} wide>
        {editing && <DriveForm drive={editing === "new" ? null : editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
