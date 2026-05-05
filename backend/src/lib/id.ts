import crypto from "node:crypto";

function randomBase64Url(bytes: number) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function newId(bytes = 12) {
  return randomBase64Url(bytes);
}

export function newShortId(bytes = 6) {
  return randomBase64Url(bytes);
}

