import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_VERSION = "scrypt-v1";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_VERSION}$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [version, salt, encodedKey] = storedHash.split("$");
  if (version !== HASH_VERSION || !salt || !encodedKey) return false;

  try {
    const expected = Buffer.from(encodedKey, "base64url");
    if (expected.length !== KEY_LENGTH) return false;
    const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
