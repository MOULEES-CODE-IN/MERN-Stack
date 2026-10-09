import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Briefcase, Building2, ClipboardCheck, FileText, GraduationCap, LayoutDashboard,
  ListChecks, LogOut, Menu, TrendingUp, User, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar } from "./ui.jsx";

const NAV = {
  student: [
    ["/", "Dashboard", LayoutDashboard],
    ["/drives", "Placement drives", Briefcase],
    ["/applications", "My applications", ListChecks],
    ["/resume", "Resume", FileText],
    ["/profile", "Profile", User],
  ],
  company: [
    ["/", "Dashboard", LayoutDashboard],
    ["/drives", "My drives", Briefcase],
    ["/applicants", "Applicants", Users],
    ["/profile", "Company profile", Building2],
  ],
  admin: [
    ["/", "Dashboard", LayoutDashboard],
    ["/companies", "Companies", Building2],
    ["/students", "Students", GraduationCap],
    ["/drives", "Drive approvals", ClipboardCheck],
    ["/reports", "Reports", TrendingUp],
    ["/profile", "Account", User],
  ],
};

const ROLE_LABEL = { student: "Student", company: "Company", admin: "Placement officer" };

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const displayName = user.role === "company" ? user.company?.companyName || user.name : user.name;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Briefcase size={18} />
          </span>
          <div>
            <strong>Placement Cell</strong>
            <small>{ROLE_LABEL[user.role]} portal</small>
          </div>
        </div>
        <nav>
          {NAV[user.role].map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="nav-link logout" onClick={logout}>
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <div className="topbar-name">
              <strong>{displayName}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </div>
            <Avatar name={displayName} size={36} />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
