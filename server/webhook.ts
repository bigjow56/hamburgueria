interface WebhookPayload {
  action: 'create' | 'update' | 'delete';
  productId: string;
  productData?: any;
  timestamp: string;
}

export async function notifyProductChange(action: 'create' | 'update' | 'delete', productId: string, productData?: any) {
  const webhookUrl = process.env.N8N_URL_MENU;
  
  const payload: WebhookPayload = {
    action,
    productId,
    productData,
    timestamp: new Date().toISOString()
  };

  // Skip webhook if URL is not configured
  if (!webhookUrl) {
    console.log(`⚠️ Webhook skipped for product ${action}: N8N_URL_MENU not configured`);
    return;
  }

  try {
    console.log(`🚀 Sending webhook for product ${action} to:`, webhookUrl);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Failed to notify webhook for product ${action}:`, response.status, response.statusText);
      console.error(`Response body:`, responseText);
    } else {
      console.log(`✅ Webhook notified successfully for product ${action}:`, productId);
      console.log(`Response:`, responseText);
    }
  } catch (error) {
    console.error(`💥 Error sending webhook for product ${action}:`, error);
  }
}