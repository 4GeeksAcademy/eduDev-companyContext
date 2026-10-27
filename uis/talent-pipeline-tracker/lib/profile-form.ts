import type { Profile, ProfileUpdate } from '../services/auth';

export type ProfileValues = { name: string; phone: string; address: string };

export function profileValues(profile: Profile): ProfileValues {
  return { name: profile.name ?? '', phone: profile.phone ?? '', address: profile.address ?? '' };
}

export function profilePayload(values: ProfileValues): ProfileUpdate {
  return {
    name: values.name.trim() || null,
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
  };
}
