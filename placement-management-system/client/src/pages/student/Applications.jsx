import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ListChecks } from "lucide-react";
import api, { errMsg } from "../../api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useFetch } from "../../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Loading, Modal, PageHeader, Tabs } from "../../components/ui.jsx";
import { APPLICATION_STATUSES } from "../../constants.js";
import { cname, fmtDate, fmtDateTime } from "../../utils.js";

export default function StudentApplications() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch("/applications/mine");
  const [tab, setTab] = useState("all");
  const [track, setTrack] = useState(null);

  if (loading && !data) return <Loading />;
  const all = data?.applications || [];
  const rows = tab === "all" ? all : all.filter((a) => a.status === tab);
  const count = (s) => all.filter((a) => a.status === s).length;

  const withdraw = async (a) => {
    if (!window.confirm("Withdraw this application?")) return;
    try {
      await api.delete(`/applications/${a._id}`);
      toast.success("Application withdrawn");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="My applications" subtitle="Follow each application from applied to offer." />
      <ErrorBox message={error} onRetry={reload} />
      <Tabs value={tab} onChange={setTab} items={[["all", "All", all.length], ...APPLICATION_STATUSES.map((s) => [s, s[0].toUpperCase() + s.slice(1), count(s)])]} />

      {rows.length ? (
        <div className="card list">
          {rows.map((a) => (
            <div className="list-row" key={a._id}>
              <Avatar name={cname(a.company)} />
              <div className="grow">
                <strong>{a.drive?.title || "Drive removed"}</strong>
                <small>
                  {cname(a.company)} · {a.drive?.ctc} LPA · applied {fmtDate(a.createdAt)}
                </small>
                {a.interviewDate && a.status === "interview" && (
                  <small className="text-warn">
                    <CalendarDays size={13} /> Interview on {fmtDateTime(a.interviewDate)}
                  </small>
                )}
              </div>
              <Badge status={a.status} />
              <button className="btn btn-sm btn-ghost" onClick={() => setTrack(a)}>
                Track
              </button>
              {a.status === "applied" && (
                <button className="btn btn-sm btn-ghost danger" onClick={() => withdraw(a)}>
                  Withdraw
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={ListChecks} title={tab === "all" ? "No applications yet" : `Nothing in ${tab}`} text="Applications you send will be listed here.">
          {tab === "all" && (
            <Link className="btn btn-primary" to="/drives">
              Browse drives
            </Link>
          )}
        </Empty>
      )}

      <Modal open={!!track} onClose={() => setTrack(null)} title={track?.drive?.title || "Application"}>
        {track && (
          <ol className="timeline">
            {track.timeline.map((t, i) => (
              <li key={i}>
                <Badge status={t.status} />
                <div>
                  <small>{fmtDateTime(t.at)}</small>
                  {t.note && <p>{t.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </>
  );
}
