interface WebhookPayload {
  action: 'create' | 'update' | 'delete';
  productId: string;
  productData?: any;
  timestamp: string;
}

// Sanitize product data to remove sensitive information
function sanitizeProductData(productData: any): any {
  if (!productData) return null;
  
  // Only include safe, non-sensitive fields
  const safeFields = ['name', 'category', 'price', 'isAvailable', 'description'];
  const sanitized: any = {};
  
  for (const field of safeFields) {
    if (productData[field] !== undefined) {
      sanitized[field] = productData[field];
    }
  }
  
  return sanitized;
}

export async function notifyProductChange(action: 'create' | 'update' | 'delete', productId: string, productData?: any) {
  const webhookUrl = process.env.N8N_URL_MENU;
  
  // Skip webhook if URL is not configured
  if (!webhookUrl) {
    console.log(`⚠️ Webhook skipped for product ${action}: N8N_URL_MENU not configured`);
    return;
  }

  // Validate inputs
  if (!productId || typeof productId !== 'string') {
    console.error(`❌ Invalid product ID provided to webhook: ${productId}`);
    return;
  }

  try {
    // Sanitize product data to remove sensitive information
    const sanitizedData = sanitizeProductData(productData);
    
    const payload: WebhookPayload = {
      action,
      productId,
      productData: sanitizedData,
      timestamp: new Date().toISOString()
    };

    console.log(`🚀 Sending webhook for product ${action} (ID: ${productId})`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BurgerHouse-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook failed for product ${action} (ID: ${productId}): HTTP ${response.status}`);
    } else {
      console.log(`✅ Webhook sent successfully for product ${action} (ID: ${productId})`);
    }
  } catch (error) {
    // Don't log the full error details which might contain sensitive information
    console.error(`💥 Webhook error for product ${action} (ID: ${productId}): Connection failed`);
  }
}