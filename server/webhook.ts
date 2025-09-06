interface WebhookPayload {
  action: 'create' | 'update' | 'delete';
  productId: string;
  productData?: any;
  timestamp: string;
}

export async function notifyProductChange(action: 'create' | 'update' | 'delete', productId: string, productData?: any) {
  const webhookUrl = 'https://n8n-curso-n8n.yao8ay.easypanel.host/webhook-test/products';
  
  const payload: WebhookPayload = {
    action,
    productId,
    productData,
    timestamp: new Date().toISOString()
  };

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