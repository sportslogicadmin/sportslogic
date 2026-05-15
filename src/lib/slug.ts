import { customAlphabet } from "nanoid";

// 8-char alphanumeric slug — ~57 bits of entropy, URL-safe
export const generateSlug = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8
);
