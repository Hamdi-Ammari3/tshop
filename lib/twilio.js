import twilio from "twilio";

let client;

export function getTwilioClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export function toE164Tunisia(rawPhone) {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  return `+216${digits}`;
}

// Tries WhatsApp first (cheaper), falls back to SMS if WhatsApp send fails for any reason.
// Returns the channel that actually succeeded, so the UI can say "we sent it via WhatsApp/SMS".
export async function sendVerificationPreferWhatsapp(e164Phone) {
  const client = getTwilioClient();

  try {
    await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: e164Phone, channel: "whatsapp" });
    return { channel: "whatsapp" };
  } catch (whatsappErr) {
    console.warn("WhatsApp OTP failed, falling back to SMS:", whatsappErr.message);
    await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: e164Phone, channel: "sms" });
    return { channel: "sms" };
  }
}