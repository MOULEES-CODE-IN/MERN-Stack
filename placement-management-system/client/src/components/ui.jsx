import { useEffect } from "react";
import { X, Inbox, LoaderCircle } from "lucide-react";
import { initials } from "../utils.js";

export function Avatar({ name, size = 38 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name) || "?"}
    </span>
  );
}

export function Badge({ status, children }) {
  return <span className={`badge badge-${status}`}>{children || status}</span>;
}

export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="stat">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs" role="tablist">
      {items.map(([v, label, count]) => (
        <button key={v} role="tab" aria-selected={v === value} className={v === value ? "tab active" : "tab"} onClick={() => onChange(v)}>
          {label}
          {count !== undefined && <span className="tab-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, text, children }) {
  return (
    <div className="empty">
      <Icon size={30} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle size={20} className="spin" /> Loading…
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error">
      {message}
      {onRetry && (
        <button className="btn btn-sm btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ label, hint, children, full }) {
  return (
    <label className={`field ${full ? "field-full" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Section({ title, action, children, flush }) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      <div className={flush ? "card-flush" : "card-body"}>{children}</div>
    </section>
  );
}
