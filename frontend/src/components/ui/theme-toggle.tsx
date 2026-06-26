import { useTheme } from "../../context/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10 dark:text-slate-100"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
