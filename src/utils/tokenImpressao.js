// utils/printingToken.js
import crypto from "crypto";

export function generateOpaqueToken(len = 48) {
  // len em bytes -> string hex (~2*len chars). 48 bytes => 96 chars
  return crypto.randomBytes(len).toString("hex");
}

export function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}
