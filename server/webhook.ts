interface WebhookPayload {
  action: 'create' | 'update' | 'delete';
  productId: string;
  productData?: any;
  timestamp: string;
}

export async function notifyProductChange(action: 'create' | 'update' | 'delete', productId: string, productData?: any) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  const payload: WebhookPayload = {
    action,
    productId,
    productData,
    timestamp: new Date().toISOString()
  };

  // Skip webhook if URL is not configured
  if (!webhookUrl) {
    console.log(`⚠️ Webhook skipped for product ${action}: N8N_WEBHOOK_URL not configured`);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to notify webhook for product ${action}:`, response.status, response.statusText);
    } else {
      console.log(`✅ Webhook notified successfully for product ${action}:`, productId);
    }
  } catch (error) {
    console.error(`Error sending webhook for product ${action}:`, error);
  }
}