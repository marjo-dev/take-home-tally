// Theme management

export function applyTheme(theme) {
  document.body.classList.remove("theme-dark", "theme-light");
  const applied = theme === "light" ? "theme-light" : "theme-dark";
  document.body.classList.add(applied);
}

