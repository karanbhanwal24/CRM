import { Link, useLocation } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = [
    { label: "Dashboard", to: "/" },
    ...segments.map((segment, index) => {
      const to = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        label: formatSegment(segment, segments[index - 1], index === segments.length - 1),
        to,
      };
    }),
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-5 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        {crumbs.map((crumb, index) => (
          <li key={crumb.to} className="flex items-center gap-2">
            {index === crumbs.length - 1 ? (
              <span className="text-slate-200">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="transition hover:text-white">
                {crumb.label}
              </Link>
            )}
            {index < crumbs.length - 1 ? <span>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function formatSegment(segment: string, previousSegment?: string, isLast?: boolean) {
  if (segment === "new") return "Create";
  if (segment === "edit") return "Edit";
  if (segment === "login") return "Login";
  if (/^\d+$/.test(segment)) {
    if (previousSegment) {
      return `${singularize(previousSegment)} ${isLast ? "Details" : segment}`;
    }
    return "Details";
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function singularize(value: string) {
  const normalized = value.replace(/-/g, " ");
  if (normalized.endsWith("ies")) {
    return `${normalized.slice(0, -3)}y`;
  }
  if (normalized.endsWith("s")) {
    return normalized.slice(0, -1).replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
