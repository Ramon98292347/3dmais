import type { CustomerData } from "../catalog/types";

const profilePrefix = "criar3d:customer:";

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function readCustomerProfile(phone: string, storage: Storage): CustomerData | null {
  const digits = normalizePhone(phone);
  if (digits.length < 10 || digits.length > 13) return null;

  try {
    const saved = storage.getItem(`${profilePrefix}${digits}`);
    if (!saved) return null;
    const profile = JSON.parse(saved) as CustomerData;
    return normalizePhone(profile.whatsapp) === digits ? profile : null;
  } catch {
    return null;
  }
}

export function saveCustomerProfile(customer: CustomerData, storage: Storage) {
  const digits = normalizePhone(customer.whatsapp);
  if (digits.length < 10 || digits.length > 13) return false;

  try {
    storage.setItem(`${profilePrefix}${digits}`, JSON.stringify(customer));
    return true;
  } catch {
    return false;
  }
}
