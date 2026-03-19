export interface DefaultSignee {
  name: string;
  role: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoDataUrl?: string;
  defaultSignees?: DefaultSignee[];
}

const LS_KEY = 'company_profile';

export function getCompanyProfile(): CompanyProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCompanyProfile(profile: CompanyProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch {}
}

export function buildKopFromProfile(profile: CompanyProfile): string {
  const lines = [profile.name];
  if (profile.address) lines.push(profile.address);
  const contact: string[] = [];
  if (profile.phone) contact.push(`Telp: ${profile.phone}`);
  if (profile.email) contact.push(`Email: ${profile.email}`);
  if (profile.website) contact.push(profile.website);
  if (contact.length) lines.push(contact.join(' | '));
  return lines.join('\n');
}
