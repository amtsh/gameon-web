const PROBE_PREFIXES = [
  "/.env",
  "/.git",
  "/.aws",
  "/.vscode",
  "/.svn",
  "/.hg",
  "/.DS_Store",
  "/wp-",
  "/wordpress",
  "/phpmyadmin",
  "/pma/",
  "/administrator",
  "/cgi-bin/",
  "/aws/",
  "/amplify/",
  "/package-updates/",
  "/var/",
  "/prod/",
  "/client/",
  "/backend/",
  "/web/",
  "/user/",
  "/lms/",
  "/root/",
  "/services/",
  "/api/credentials",
  "/api/config",
] as const;

const PROBE_EXACT = new Set([
  "/xmlrpc.php",
  "/login",
  "/cart",
  "/serverless.yml",
  "/sam-template.yaml",
]);

const PROBE_SUBSTRINGS = [
  "/.env",
  "/config/common.js",
  "/config.js",
  "/credentials",
  "/perform.cgi",
  "/refresh.cgi",
  "/bucket",
  "/environments.ini",
  "/team-provider-info.json",
] as const;

const PROBE_EXTENSIONS = /\.(?:php|cgi|ya?ml|ini)$/i;

/** Common vulnerability-scan paths that should never hit SSR or Supabase. */
export function isProbePath(pathname: string): boolean {
  const path = pathname.toLowerCase();

  if (PROBE_EXACT.has(path)) return true;
  if (PROBE_PREFIXES.some((prefix) => path.startsWith(prefix.toLowerCase()))) {
    return true;
  }
  if (PROBE_SUBSTRINGS.some((part) => path.includes(part))) return true;
  if (PROBE_EXTENSIONS.test(path)) return true;

  return false;
}
