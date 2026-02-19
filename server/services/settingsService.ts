// server/services/settingsService.ts
import { storage } from "../storage";

export async function getSettings(tenantId: string) {
  return storage.getSettings(tenantId);
}

export async function updateSettings(tenantId: string, data: any) {
  return storage.updateSettings(tenantId, data);
}
