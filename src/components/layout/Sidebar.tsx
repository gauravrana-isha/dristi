import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/hate", label: "Hate Track", icon: "🔴" },
  { to: "/misinfo", label: "Misinfo Track", icon: "🟠" },
  { to: "/accounts", label: "Accounts", icon: "👤" },
  { to: "/network", label: "Network", icon: "🕸️" },
  { to: "/about", label: "About", icon: "ℹ️" },
  { to: "/admin", label: "Admin", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <nav
      className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col"
      aria-label="Main navigation"
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
          Sadhguru Intel
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Threat Intelligence Dashboard
        </p>
      </div>
      <ul className="space-y-1 flex-1">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
              aria-label={link.label}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
