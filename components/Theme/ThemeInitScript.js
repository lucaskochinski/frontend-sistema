/** Evita flash de tema errado antes do React hidratar */
export default function ThemeInitScript() {
  const script = `
(function () {
  try {
    var key = "hooko.theme";
    var stored = localStorage.getItem(key);
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
