import * as bcrypt from 'bcrypt';

export async function hash(raw: string) {
  const SALT = await bcrypt.genSalt();

  return await bcrypt.hash(raw, SALT);
}

export async function compare(raw: string, encoded: string) {
  return await bcrypt.compare(raw, encoded);
}

export function generateAPIKey(userUUID: string): string {
  const random = crypto.randomUUID();

  return `vas_${userUUID}_${random}`;
}
