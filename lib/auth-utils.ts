export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  const user = localStorage.getItem("user")
  return !!user
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null

  const user = localStorage.getItem("user")
  if (!user) return null

  return JSON.parse(user)
}

export function logout() {
  if (typeof window === "undefined") return

  localStorage.removeItem("user")
  window.location.href = "/login"
}
