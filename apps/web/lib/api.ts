const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("forge_token");
}

export function setToken(token: string) {
  localStorage.setItem("forge_token", token);
}

export function clearToken() {
  localStorage.removeItem("forge_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ─── Auth ───
export const auth = {
  signup: (email: string, password: string) =>
    request<{ user: any; token: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  google: (idToken: string) =>
    request<{ user: any; token: string; isNewUser: boolean }>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  me: () => request<{ user: any }>("/api/auth/me"),
};

// ─── Profile ───
export const profile = {
  get: () => request<{ profile: any }>("/api/profile"),
  create: (data: any) =>
    request<{ profile: any }>("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (data: any) =>
    request<{ profile: any }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Logs ───
export const logs = {
  weight: (value: number) =>
    request<{ entry: any }>("/api/logs/weight", {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
  calories: (value: number) =>
    request<{ entry: any }>("/api/logs/calories", {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
  workout: (exercises: { name: string; weight: number; reps: number; sets: number }[]) =>
    request<{ entry: any }>("/api/logs/workout", {
      method: "POST",
      body: JSON.stringify({ exercises }),
    }),
  delete: (type: string, id: string) =>
    request<{ deleted: any }>(`/api/logs/${type}/${id}`, { method: "DELETE" }),
};

// ─── Dashboard ───
export const dashboard = {
  get: () => request<{
    recommendation: any;
    weightChart: { value: number; ts: number }[];
    calorieChart: { value: number; ts: number }[];
    pastRecommendations: { week: string; status: string; calorieAction: string }[];
  }>("/api/dashboard"),
};

// ─── History ───
export const history = {
  get: (type = "all", limit = 60, before?: string) => {
    const params = new URLSearchParams({ type, limit: String(limit) });
    if (before) params.set("before", before);
    return request<{ entries: any[]; count: number }>(`/api/history?${params}`);
  },
};

// ─── Check-ins ───
export const checkins = {
  next: () => request<{ checkIn: any | null }>("/api/checkins/next"),
  submit: (type: string, value: string) =>
    request<{ entry: any }>("/api/checkins", {
      method: "POST",
      body: JSON.stringify({ type, value }),
    }),
};

// ─── Recommendations ───
export const recommendations = {
  lock: () => request<any>("/api/recommendations/lock", { method: "POST" }),
  history: () => request<{ recommendations: any[] }>("/api/recommendations"),
};

// ─── Admin ───
export const admin = {
  stats: () => request<any>("/api/admin/stats"),
  users: (params?: { limit?: number; offset?: number; search?: string }) => {
    const p = new URLSearchParams();
    if (params?.limit) p.set("limit", String(params.limit));
    if (params?.offset) p.set("offset", String(params.offset));
    if (params?.search) p.set("search", params.search);
    return request<any>(`/api/admin/users?${p}`);
  },
  user: (id: string) => request<any>(`/api/admin/users/${id}`),
};
