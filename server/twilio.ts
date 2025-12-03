export async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("From", fromNumber);
    formData.append("To", phoneNumber);
    formData.append("Body", message);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data: any = await response.json();
    return { success: true, messageId: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendWhatsApp(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber) {
    return { success: false, error: "Twilio WhatsApp credentials not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("From", `whatsapp:${whatsappNumber}`);
    formData.append("To", `whatsapp:${phoneNumber}`);
    formData.append("Body", message);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data: any = await response.json();
    return { success: true, messageId: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
