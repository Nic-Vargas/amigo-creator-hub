import { apiFetch } from "@/lib/api";

export type ImportRecobrosResponse = {
  message: string;
  company: string;
  totalRows: number;
  beneficiariesCreated: number;
  beneficiariesUpdated: number;
  casesCreated: number;
  movementsCreated: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.10.21:3000";

export async function importarRecobrosExcel(
  file: File
): Promise<ImportRecobrosResponse> {
  const token = localStorage.getItem("sisrec_token");
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_URL}/imports/recobros`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message ?? "No fue posible importar el archivo."
    );
  }

  return data as ImportRecobrosResponse;
}