import { apiFetch } from "@/lib/api";

export type ImportRecobrosResponse = {
  message: string;
  company: string;
  totalRows: number;
  beneficiariesCreated: number;
  beneficiariesUpdated: number;
  casesCreated: number;
  movementsCreated: number;
  movementDetailsCreated: number;
};

export async function importarRecobrosExcel(
  file: File
): Promise<ImportRecobrosResponse> {
  const formData = new FormData();

  formData.append("file", file);

  return apiFetch<ImportRecobrosResponse>("/imports/recobros", {
    method: "POST",
    body: formData,
  });
}