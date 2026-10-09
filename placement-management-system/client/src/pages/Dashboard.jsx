import { Link } from "react-router-dom";
import {
  Award, Briefcase, Building2, CalendarDays, ClipboardCheck, GraduationCap, Hourglass,
  ListChecks, Send, TrendingUp, Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useFetch } from "../hooks.js";
import { Avatar, Badge, Empty, ErrorBox, Loading, PageHeader, Section, StatCard } from "../components/ui.jsx";
import DriveCard from "../components/DriveCard.jsx";
import { STATUS_COLORS } from "../constants.js";
import { cname, fmtDate, profileScore } from "../utils.js";

const TEAL = "#0E7C86";

function StatusDonut({ data }) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <Empty icon={ListChecks} title="No applications yet" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {rows.map((r) => (
            <Cell key={r.name} fill={STATUS_COLORS[r.name]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function StudentDashboard({ user, data }) {
  const { stats, chart, recent, recommended } = data;
  const { score, missing } = profileScore(user);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Here is where your placement journey stands today." />

      {score < 100 && (
        <div className="callout">
          <div>
            <strong>Your profile is {score}% complete</strong>
            <p>Companies see this when you apply. Next step: {missing[0].label.toLowerCase()}.</p>
            <div className="progress">
              <span style={{ width: `${score}%` }} />
            </div>
          </div>
          <Link className="btn btn-primary" to={missing[0].to}>
            Complete profile
          </Link>
        </div>
      )}

      <div className="stats">
        <StatCard icon={Send} label="Applications sent" value={stats.applied} />
        <StatCard icon={ClipboardCheck} label="Shortlisted" value={stats.shortlisted} />
        <StatCard icon={CalendarDays} label="Interviews" value={stats.interview} />
        <StatCard icon={Award} label="Offers" value={stats.selected} />
        <StatCard icon={Briefcase} label="Open drives" value={stats.openDrives} />
        <StatCard icon={GraduationCap} label="Eligible for you" value={stats.eligibleDrives} />
      </div>

      <div className="two-col">
        <Section title="Recommended for you" action={<Link to="/drives" className="link">See all drives</Link>}>
          {recommended.length ? (
            <div className="drive-grid compact">
              {recommended.map((d) => (
                <DriveCard key={d._id} drive={d} />
              ))}
            </div>
          ) : (
            <Empty icon={Briefcase} title="Nothing new right now" text="Drives that match your department and CGPA will appear here." />
          )}
        </Section>
        <Section title="Application status">
          <StatusDonut data={chart} />
        </Section>
      </div>

      <Section title="Recent applications" action={<Link to="/applications" className="link">View all</Link>} flush>
        {recent.length ? (
          <div className="list">
            {recent.map((a) => (
              <div className="list-row" key={a._id}>
                <Avatar name={cname(a.company)} />
                <div className="grow">
                  <strong>{a.drive?.title || "Removed drive"}</strong>
                  <small>
                    {cname(a.company)} · applied {fmtDate(a.createdAt)}
                  </small>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Send} title="You have not applied yet" text="Browse placement drives and send your first application.">
            <Link className="btn btn-primary" to="/drives">
              Browse drives
            </Link>
          </Empty>
        )}
      </Section>
    </>
  );
}

function CompanyDashboard({ user, data }) {
  const { stats, chart, perDrive, recent } = data;
  return (
    <>
      <PageHeader
        title={`Hello, ${user.company?.companyName || user.name}`}
        subtitle="Your hiring pipeline at a glance."
        actions={<Link className="btn btn-primary" to="/drives">Post a drive</Link>}
      />
      <div className="stats">
        <StatCard icon={Briefcase} label="Drives posted" value={stats.totalDrives} />
        <StatCard icon={TrendingUp} label="Active drives" value={stats.activeDrives} />
        <StatCard icon={Hourglass} label="Awaiting approval" value={stats.pendingDrives} />
        <StatCard icon={Users} label="Total applicants" value={stats.applicants} />
        <StatCard icon={ClipboardCheck} label="Shortlisted" value={stats.shortlisted} />
        <StatCard icon={Award} label="Selected" value={stats.selected} />
      </div>
      <div className="two-col">
        <Section title="Applicants per drive">
          {perDrive.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perDrive}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="applicants" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty icon={Briefcase} title="No drives yet" text="Post your first drive to start receiving applicants." />
          )}
        </Section>
        <Section title="Pipeline">
          <StatusDonut data={chart} />
        </Section>
      </div>
      <Section title="Latest applicants" action={<Link to="/applicants" className="link">Manage applicants</Link>} flush>
        {recent.length ? (
          <div className="list">
            {recent.map((a) => (
              <div className="list-row" key={a._id}>
                <Avatar name={a.student?.name} />
                <div className="grow">
                  <strong>{a.student?.name}</strong>
                  <small>
                    {a.student?.student?.department} · CGPA {a.student?.student?.cgpa ?? "-"} · {a.drive?.title}
                  </small>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Users} title="No applicants yet" />
        )}
      </Section>
    </>
  );
}

function AdminDashboard({ data, reload }) {
  const toast = useToast();
  const { stats, chart, departments, topCompanies, pendingCompanies, pendingDrives } = data;

  const act = async (url, body, message) => {
    try {
      await api.patch(url, body);
      toast.success(message);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Placement overview" subtitle="Approvals, activity and results across the campus." />
      <div className="stats">
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={Building2} label="Approved companies" value={stats.companies} />
        <StatCard icon={Briefcase} label="Active drives" value={stats.activeDrives} />
        <StatCard icon={Send} label="Applications" value={stats.applications} />
        <StatCard icon={Award} label="Students placed" value={stats.placed} />
        <StatCard icon={TrendingUp} label="Placement rate" value={`${stats.placementRate}%`} />
      </div>

      {(stats.pendingCompanies > 0 || stats.pendingDrives > 0) && (
        <div className="two-col">
          <Section title={`Companies awaiting approval (${stats.pendingCompanies})`} flush>
            {pendingCompanies.length ? (
              <div className="list">
                {pendingCompanies.map((c) => (
                  <div className="list-row" key={c._id}>
                    <Avatar name={c.company?.companyName} />
                    <div className="grow">
                      <strong>{c.company?.companyName}</strong>
                      <small>{c.email}</small>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => act(`/admin/users/${c._id}/status`, { status: "approved" }, "Company approved")}>
                      Approve
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => act(`/admin/users/${c._id}/status`, { status: "rejected" }, "Company rejected")}>
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="All caught up" />
            )}
          </Section>
          <Section title={`Drives awaiting approval (${stats.pendingDrives})`} action={<Link to="/drives" className="link">Review all</Link>} flush>
            {pendingDrives.length ? (
              <div className="list">
                {pendingDrives.map((d) => (
                  <div className="list-row" key={d._id}>
                    <Avatar name={cname(d.company)} />
                    <div className="grow">
                      <strong>{d.title}</strong>
                      <small>
                        {cname(d.company)} · {d.ctc} LPA
                      </small>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => act(`/drives/${d._id}/status`, { status: "approved" }, "Drive approved")}>
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="All caught up" />
            )}
          </Section>
        </div>
      )}

      <div className="two-col">
        <Section title="Department-wise placement">
          {departments.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#B9CFCC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" name="Placed" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty icon={GraduationCap} title="No students registered yet" />
          )}
        </Section>
        <Section title="Applications by status">
          <StatusDonut data={chart} />
        </Section>
      </div>

      <Section title="Top recruiters" flush>
        {topCompanies.length ? (
          <div className="list">
            {topCompanies.map((c, i) => (
              <div className="list-row" key={c.name}>
                <Avatar name={c.name} />
                <div className="grow">
                  <strong>{c.name}</strong>
                </div>
                <span className="chip">
                  {c.hires} {c.hires === 1 ? "student" : "students"} selected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Award} title="No selections yet" text="Companies appear here once students are marked as selected." />
        )}
      </Section>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch("/dashboard");

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (user.role === "student") return <StudentDashboard user={user} data={data} />;
  if (user.role === "company") return <CompanyDashboard user={user} data={data} />;
  return <AdminDashboard data={data} reload={reload} />;
}
