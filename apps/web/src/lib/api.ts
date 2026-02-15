const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const laravelBase = process.env.NEXT_PUBLIC_LARAVEL_BASE || "http://localhost:8000";

type ApiOptions = RequestInit & {
  json?: unknown;
};

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const { json, headers, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();
  if (typeof document !== "undefined" && !["GET", "HEAD"].includes(method)) {
    const hasXsrf = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("XSRF-TOKEN="));
    if (!hasXsrf) {
      await getCsrfCookie();
    }
  }

  const xsrfToken =
    typeof document !== "undefined"
      ? document.cookie
          .split(";")
          .map((cookie) => cookie.trim())
          .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
          ?.split("=")[1]
      : undefined;
  const fetchOptions: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(xsrfToken
        ? { "X-XSRF-TOKEN": decodeURIComponent(xsrfToken) }
        : {}),
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    credentials: "include",
    body: json ? JSON.stringify(json) : rest.body,
  };

  const response = await fetch(`${apiBase}${path}`, fetchOptions);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error: any = new Error(errorBody.message || "API request failed");
    error.response = errorBody;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getCsrfCookie() {
  await fetch(`${laravelBase}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}
