import type { ContactInfo } from "@/app/types";

function whatsappUrl(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function telegramUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromUrl = trimmed.match(
    /^(?:https?:\/\/)?(?:t(?:elegram)?\.me)\/([A-Za-z0-9_]{1,32})\/?$/i,
  );
  if (fromUrl) return fromUrl[1];

  const fromHandle = trimmed.match(/^@([A-Za-z0-9_]{1,32})$/);
  if (fromHandle) return fromHandle[1];

  const plain = trimmed.match(/^([A-Za-z0-9_]{1,32})$/);
  if (plain) return plain[1];

  return null;
}

function telegramUrl(value: string): string | null {
  const username = telegramUsername(value);
  return username ? `https://t.me/${username}` : null;
}

/** Deep link that opens a chat with the host on WhatsApp or Telegram. */
export function contactUrl(contact: ContactInfo): string | null {
  const value = contact.value.trim();
  if (!value) return null;

  if (contact.method === "whatsapp") {
    return whatsappUrl(value);
  }

  return telegramUrl(value);
}
