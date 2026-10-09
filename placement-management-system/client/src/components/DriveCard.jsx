import { Link } from "react-router-dom";
import { Clock, IndianRupee, MapPin } from "lucide-react";
import { Avatar, Badge } from "./ui.jsx";
import { cname, daysLeft } from "../utils.js";

export default function DriveCard({ drive }) {
  const left = daysLeft(drive.deadline);
  const blocked = drive.eligibility && !drive.eligibility.eligible && !drive.applicationStatus;

  return (
    <Link to={`/drives/${drive._id}`} className="drive-card">
      <div className="drive-top">
        <Avatar name={cname(drive.company)} />
        <div className="drive-title">
          <h3>{drive.title}</h3>
          <p>{cname(drive.company)}</p>
        </div>
        {drive.applicationStatus && <Badge status={drive.applicationStatus} />}
      </div>

      <div className="chips">
        <span className="chip">
          <IndianRupee size={13} /> {drive.ctc} LPA
        </span>
        <span className="chip">
          <MapPin size={13} /> {drive.location}
        </span>
        <span className="chip">{drive.jobType}</span>
      </div>

      <div className="skills">
        {(drive.skills || []).slice(0, 4).map((s) => (
          <span key={s} className="skill">
            {s}
          </span>
        ))}
      </div>

      <div className="drive-foot">
        <span className={left <= 3 ? "text-warn" : ""}>
          <Clock size={13} /> {left <= 0 ? "Closes today" : `${left} day${left === 1 ? "" : "s"} left`}
        </span>
        {blocked && <span className="text-muted">{drive.eligibility.reasons[0]}</span>}
      </div>
    </Link>
  );
}
