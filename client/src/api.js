const API_BASE = "";

/**
 * Fetch helper with JSON.
 */
async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(API_BASE + path, {
    ...options,
    headers
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(msg.error || "Request failed");
  }
  return res.json();
}

export async function register(username, password) {
  return api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function login(username, password) {
  return api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function getMe() {
  return api("/api/profile/me");
}

export async function getLeaderboard(type = "ranked") {
  return api(`/api/leaderboard/${type}`);
}

export async function queueJoin(queueType, mode, partyId) {
  return api("/api/matchmaking/queue", {
    method: "POST",
    body: JSON.stringify({ queueType, mode, partyId })
  });
}

export async function queueLeave() {
  return api("/api/matchmaking/leave", {
    method: "POST"
  });
}
