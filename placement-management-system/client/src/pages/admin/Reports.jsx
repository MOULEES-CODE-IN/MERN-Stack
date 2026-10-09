import { Award, Download, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFetch } from "../../hooks.js";
import { Empty, ErrorBox, Loading, PageHeader, Section, StatCard } from "../../components/ui.jsx";
import { downloadCsv } from "../../utils.js";

export default function AdminReports() {
  const { data, loading, error, reload } = useFetch("/admin/report");
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { summary, departments, companies, placements } = data;

  const exportCsv = () =>
    downloadCsv(
      "placed-students.csv",
      placements.map((p) => ({
        Name: p.name, "Roll no": p.rollNo, Department: p.department, CGPA: p.cgpa ?? "",
        Company: p.company, Role: p.role, "Package (LPA)": p.ctc, Email: p.email,
      }))
    );

  return (
    <>
      <PageHeader
        title="Placement reports"
        subtitle="Results based on students marked as selected."
        actions={
          <button className="btn btn-primary" onClick={exportCsv} disabled={!placements.length}>
            <Download size={16} /> Export placed students
          </button>
        }
      />
      <div className="stats">
        <StatCard icon={Award} label="Students placed" value={summary.placed} hint={`of ${summary.totalStudents} registered`} />
        <StatCard icon={TrendingUp} label="Highest package" value={`${summary.highestCtc} LPA`} />
        <StatCard icon={Users} label="Average package" value={`${summary.averageCtc} LPA`} />
      </div>

      <div className="two-col">
        <Section title="Placement rate by department">
          {departments.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" fontSize={12} />
                <YAxis unit="%" domain={[0, 100]} fontSize={12} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" name="Placement rate" fill="#0E7C86" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty title="No data yet" />
          )}
        </Section>
        <Section title="Company-wise hiring" flush>
          {companies.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Hires</th>
                    <th>Average package</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.company}>
                      <td>{c.company}</td>
                      <td>{c.hires}</td>
                      <td>{c.avgCtc} LPA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={Award} title="No selections yet" />
          )}
        </Section>
      </div>

      <Section title="Placed students" flush>
        {placements.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll no.</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Package</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.rollNo}</td>
                    <td>{p.department}</td>
                    <td>{p.cgpa ?? "-"}</td>
                    <td>{p.company}</td>
                    <td>{p.role}</td>
                    <td>{p.ctc} LPA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={Award} title="No placements recorded" text="Mark applicants as Selected to see them here." />
        )}
      </Section>
    </>
  );
}
