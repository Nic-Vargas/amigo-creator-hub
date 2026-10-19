const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (
  configuredApiUrl || "http://192.168.10.28:3000"
).replace(/\/+$/, "");

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("sisrec_token");
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    let response: Response;

  try {
    response = await fetch(`${API_URL}${normalizedPath}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "No fue posible confirmar la operación con el servidor. " +
      "Si estabas registrando un movimiento, no lo ingreses nuevamente " +
      "sin verificar primero si quedó guardado."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message ?? `Error HTTP ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}