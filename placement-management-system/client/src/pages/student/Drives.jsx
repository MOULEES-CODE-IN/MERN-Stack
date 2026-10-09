import { useState } from "react";
import { Briefcase, Search } from "lucide-react";
import { useDebounce, useFetch } from "../../hooks.js";
import { Empty, ErrorBox, Loading, PageHeader } from "../../components/ui.jsx";
import DriveCard from "../../components/DriveCard.jsx";
import { JOB_TYPES } from "../../constants.js";

export default function StudentDrives() {
  const [filters, setFilters] = useState({ q: "", jobType: "", minCtc: "", sort: "latest" });
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const q = useDebounce(filters.q);
  const { data, loading, error, reload } = useFetch("/drives", { ...filters, q });

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const drives = (data?.drives || []).filter((d) => !eligibleOnly || d.eligibility.eligible);

  return (
    <>
      <PageHeader title="Placement drives" subtitle="Open drives from approved companies." />

      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search by role, company, skill or location" value={filters.q} onChange={set("q")} />
        </div>
        <select className="input" value={filters.jobType} onChange={set("jobType")} aria-label="Job type">
          <option value="">All job types</option>
          {JOB_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className="input" value={filters.minCtc} onChange={set("minCtc")} aria-label="Minimum package">
          <option value="">Any package</option>
          {[3, 5, 8, 10, 15].map((n) => (
            <option key={n} value={n}>
              {n}+ LPA
            </option>
          ))}
        </select>
        <select className="input" value={filters.sort} onChange={set("sort")} aria-label="Sort">
          <option value="latest">Newest first</option>
          <option value="ctc">Highest package</option>
          <option value="deadline">Closing soon</option>
        </select>
        <label className="toggle">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
          Eligible only
        </label>
      </div>

      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : drives.length ? (
        <div className="drive-grid">
          {drives.map((d) => (
            <DriveCard key={d._id} drive={d} />
          ))}
        </div>
      ) : (
        <Empty icon={Briefcase} title="No drives match" text="Try removing a filter or searching for a different skill." />
      )}
    </>
  );
}
