// lib/api-url.ts
// Helper to prefix API paths with the Next.js basePath.
// fetch() does NOT auto-prefix basePath (only next/link and next/navigation do).
// Use: fetch(apiUrl("/api/users")) instead of fetch("/api/users")

function getBasePath(): string {
  // On the server, use the env var
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH) {
    return process.env.NEXT_PUBLIC_BASE_PATH
  }
  // On the client, derive from window.location.pathname
  if (typeof window !== "undefined") {
    // The app is served under /facilia, so any path starts with it.
    // We extract it from the current URL to avoid relying on env inlining.
    const path = window.location.pathname
    const match = path.match(/^(\/[^\/]+)/)
    if (match) return match[1]
  }
  return ""
}

export function apiUrl(path: string): string {
  const basePath = getBasePath()
  if (path.startsWith(basePath)) return path
  return `${basePath}${path}`
}
