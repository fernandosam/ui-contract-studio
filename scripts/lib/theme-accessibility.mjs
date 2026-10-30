/** Dependency-free WCAG semantic token audit: no arbitrary CSS or runtime input. */
export const TEXT_PAIRS = Object.freeze([
  ["foreground", "background"], ["card-foreground", "card"],
  ["popover-foreground", "popover"], ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"], ["muted-foreground", "muted"],
  ["muted-foreground", "background"], ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"], ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
]);
export const FOCUS_PAIRS = Object.freeze([["ring", "background"], ["sidebar-ring", "sidebar"]]);

function themeColors(css, mode) {
  const match = mode === "light"
    ? css.match(/:root\s*,\s*\.light-theme\s*\{([^}]*)\}/)
    : css.match(/\.dark-theme\s*\{([^}]*)\}/);
  if (!match) throw new Error("Missing " + mode + " CSS block");
  const tokens = new Map();
  for (const [, name, value] of match[1].matchAll(/--([\w-]+)\s*:\s*(oklch\([^)]+\))\s*;/g)) {
    if (tokens.has(name)) throw new Error("Duplicate " + mode + " color token " + name);
    tokens.set(name, value);
  }
  return tokens;
}

/** WCAG luminance of OKLCH; convert through OKLab to linear sRGB, clip to display gamut. */
export function relativeLuminance(color) {
  const match = /^oklch\(\s*(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)$/.exec(color ?? "");
  if (!match) throw new TypeError("Expected literal OKLCH color: " + color);
  const l = Number(match[1]), c = Number(match[2]), h = Number(match[3]);
  if (![l,c,h].every(Number.isFinite) || l < 0 || l > 1 || c < 0) throw new TypeError("Invalid OKLCH channel");
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
  const L = (l + 0.3963377774*a + 0.2158037573*b)**3;
  const M = (l - 0.1055613458*a - 0.0638541728*b)**3;
  const S = (l - 0.0894841775*a - 1.2914855480*b)**3;
  const components = [
    4.0767416621*L - 3.3077115913*M + 0.2309699292*S,
    -1.2684380046*L + 2.6097574011*M - 0.3413193965*S,
    -0.0041960863*L - 0.7034186147*M + 1.7076147010*S,
  ].map(v => Math.min(1, Math.max(0, v)));
  return components[0]*0.2126 + components[1]*0.7152 + components[2]*0.0722;
}
export function contrastRatio(foreground, background) {
  const f = relativeLuminance(foreground), b = relativeLuminance(background);
  return (Math.max(f,b)+0.05)/(Math.min(f,b)+0.05);
}
export function auditThemeContrast(css) {
  const checks = [];
  for (const mode of ["light","dark"]) {
    const tokens = themeColors(css,mode);
    for (const [kind,pairs,minimum] of [["text",TEXT_PAIRS,4.5],["focus",FOCUS_PAIRS,3]]) {
      for (const [foreground,background] of pairs) {
        const fg = tokens.get(foreground), bg = tokens.get(background);
        if (!fg || !bg) throw new Error("Missing " + mode + " color " + foreground + "/" + background);
        const ratio = contrastRatio(fg,bg);
        checks.push({mode,kind,foreground,background,ratio,minimum,pass:ratio >= minimum});
      }
    }
  }
  return checks;
}
/** Source-order cascade for the project-specific pg-grid; plain media queries only. */
export function gridColumnsAtWidth(css,width) {
  const base = css.match(/\.pg-grid\s*\{[^}]*grid-template-columns:\s*([^;]+);/);
  if (!base) throw new Error("Missing base pg-grid rule");
  let columns=base[1].trim();
  for (const match of css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)\s*\{([\s\S]*?)\n\}/g)) {
    if (width > Number(match[1])) continue;
    const rule = match[2].match(/\.pg-grid\s*\{\s*grid-template-columns:\s*([^;]+);/);
    if (rule) columns=rule[1].trim();
  }
  return columns;
}
export function auditResponsiveGrid(css) {
  const one="minmax(0, 1fr)", two="repeat(min(2, var(--columns, 1)), minmax(0, 1fr))";
  return [[520,one],[600,one],[639,one],[640,two],[800,two]].map(([width,expected])=>{
    const actual=gridColumnsAtWidth(css,width);
    return {width,actual,expected,pass:actual===expected};
  });
}
