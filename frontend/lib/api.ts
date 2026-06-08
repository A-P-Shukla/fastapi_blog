import type { ApiError, PaginatedPosts, Post, Token, UserPrivate, UserPublic } from "./types";

const BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getErrorMessage(error: ApiError): string {
  if (typeof error.detail === "string") return error.detail;
  if (Array.isArray(error.detail)) return error.detail.map((e) => e.msg).join(". ");
  return "An error occurred. Please try again.";
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/users/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<UserPrivate> {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMe(): Promise<UserPrivate | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${BASE}/users/me`, { headers: authHeader() });
  if (!res.ok) return null;
  return res.json();
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE}/users/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await res.json();
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  const res = await fetch(`${BASE}/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  if (!res.ok) throw await res.json();
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<void> {
  const res = await fetch(`${BASE}/users/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ current_password, new_password }),
  });
  if (!res.ok) throw await res.json();
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(userId: number): Promise<UserPublic> {
  const res = await fetch(`${BASE}/users/${userId}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateUser(
  userId: number,
  data: { username?: string; email?: string },
): Promise<UserPrivate> {
  const res = await fetch(`${BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function uploadProfilePicture(
  userId: number,
  file: File,
): Promise<UserPrivate> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/users/${userId}/picture`, {
    method: "PATCH",
    headers: authHeader(),
    body: form,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteProfilePicture(userId: number): Promise<UserPrivate> {
  const res = await fetch(`${BASE}/users/${userId}/picture`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteAccount(userId: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok && res.status !== 204) throw await res.json();
}

export async function getUserPosts(
  userId: number,
  skip = 0,
  limit = 10,
): Promise<PaginatedPosts> {
  const res = await fetch(`${BASE}/users/${userId}/posts?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getPosts(skip = 0, limit = 10): Promise<PaginatedPosts> {
  const res = await fetch(`${BASE}/posts?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getPost(postId: number): Promise<Post> {
  const res = await fetch(`${BASE}/posts/${postId}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createPost(title: string, content: string): Promise<Post> {
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updatePost(
  postId: number,
  data: { title?: string; content?: string },
): Promise<Post> {
  const res = await fetch(`${BASE}/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(`${BASE}/posts/${postId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok && res.status !== 204) throw await res.json();
}
