import { businessPath, partnerBlob, partnerDelete, partnerGet, partnerPost, saveRecord } from "../api/client";
import type { Client } from "./clients";

const base = (businessId: string) => businessPath(businessId, "clients");

export async function fetchClients(businessId: string): Promise<Client[]> {
  return (await partnerGet<{ clients: Client[] }>(base(businessId))).clients;
}

export async function saveClientRecord(businessId: string, client: Client, existing: boolean): Promise<Client> {
  const body = client as unknown as Record<string, unknown>;
  return (await saveRecord<{ client: Client }>(base(businessId), existing ? client.id : null, body)).client;
}

export async function deleteClientRecord(businessId: string, id: string): Promise<void> {
  await partnerDelete(`${base(businessId)}/${id}`);
}

export async function uploadClientFile(businessId: string, clientId: string, file: File): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  await partnerPost(`${base(businessId)}/${clientId}/files`, body);
}

export async function getServerClientFile(businessId: string, clientId: string, fileId: string): Promise<Blob> {
  return partnerBlob(`${base(businessId)}/${clientId}/files/${fileId}`, "Faylı yükləmək mümkün olmadı.");
}

export async function sendClientMessage(businessId: string, clientId: string, text: string): Promise<Client> {
  return (await partnerPost<{ client: Client }>(`${base(businessId)}/${clientId}/messages`, { text })).client;
}
