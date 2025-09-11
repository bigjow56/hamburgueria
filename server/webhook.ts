import { storage } from './storage';

interface WebhookPayload {
  action: 'create' | 'update' | 'delete';
  productId?: string;
  ingredientId?: string;
  categoryId?: string;
  tableName: string;
  recordId: string;
  recordData?: any;
  oldData?: any;
  timestamp: string;
}

interface WebhookNotificationService {
  processScheduledWebhooks: () => Promise<void>;
  processWebhookEvent: (eventId: string) => Promise<boolean>;
  sendWebhookNotification: (webhookConfig: any, payload: WebhookPayload) => Promise<boolean>;
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
      tableName: 'products',
      recordId: productId,
      recordData: sanitizedData,
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

// Enhanced data sanitization for different table types
function sanitizeData(tableName: string, data: any): any {
  if (!data) return null;
  
  const sanitizedData: any = {};
  
  switch (tableName) {
    case 'products':
      const productSafeFields = ['id', 'name', 'category', 'price', 'isAvailable', 'description', 'categoryId'];
      for (const field of productSafeFields) {
        if (data[field] !== undefined) {
          sanitizedData[field] = data[field];
        }
      }
      break;
      
    case 'ingredients':
      const ingredientSafeFields = ['id', 'name', 'price', 'isAvailable', 'unit'];
      for (const field of ingredientSafeFields) {
        if (data[field] !== undefined) {
          sanitizedData[field] = data[field];
        }
      }
      break;
      
    case 'categories':
      const categorySafeFields = ['id', 'name', 'description', 'isActive'];
      for (const field of categorySafeFields) {
        if (data[field] !== undefined) {
          sanitizedData[field] = data[field];
        }
      }
      break;
      
    default:
      // For unknown tables, return minimal safe data
      if (data.id) sanitizedData.id = data.id;
      if (data.name) sanitizedData.name = data.name;
      break;
  }
  
  return sanitizedData;
}

// Create webhook notification service
export function createWebhookNotificationService(): WebhookNotificationService {
  return {
    async processScheduledWebhooks(): Promise<void> {
      try {
        console.log('🔄 Processing scheduled webhooks...');
        const pendingEvents = await storage.getPendingWebhookEvents();
        
        if (pendingEvents.length === 0) {
          console.log('📭 No pending webhook events to process');
          return;
        }
        
        console.log(`📋 Found ${pendingEvents.length} pending webhook events`);
        
        for (const event of pendingEvents) {
          try {
            await this.processWebhookEvent(event.id);
          } catch (error) {
            console.error(`❌ Failed to process webhook event ${event.id}:`, error);
          }
        }
      } catch (error) {
        console.error('💥 Error in processScheduledWebhooks:', error);
      }
    },

    async processWebhookEvent(eventId: string): Promise<boolean> {
      try {
        const event = await storage.getWebhookEvent(eventId);
        if (!event) {
          console.error(`⚠️ Webhook event ${eventId} not found`);
          return false;
        }
        
        if (event.status !== 'pending') {
          console.log(`⏭️ Webhook event ${eventId} already processed (status: ${event.status})`);
          return true;
        }
        
        // Get webhook configuration
        const webhookConfig = await storage.getWebhookConfig(event.webhookConfigId);
        if (!webhookConfig) {
          console.error(`⚠️ Webhook config ${event.webhookConfigId} not found`);
          await storage.updateWebhookEventStatus(eventId, 'failed', undefined, undefined, 'Webhook configuration not found');
          return false;
        }
        
        if (!webhookConfig.isActive) {
          console.log(`⏭️ Webhook config ${event.webhookConfigId} is inactive`);
          await storage.updateWebhookEventStatus(eventId, 'skipped', undefined, undefined, 'Webhook configuration is inactive');
          return true;
        }
        
        // Create payload
        const payload: WebhookPayload = {
          action: event.operationType.toLowerCase() === 'insert' ? 'create' : 
                  event.operationType.toLowerCase() === 'update' ? 'update' : 'delete',
          tableName: event.tableName,
          recordId: event.recordId,
          recordData: event.newData ? sanitizeData(event.tableName, event.newData) : null,
          oldData: event.oldData ? sanitizeData(event.tableName, event.oldData) : null,
          timestamp: typeof event.createdAt === 'string' ? event.createdAt : event.createdAt ? event.createdAt.toISOString() : new Date().toISOString()
        };
        
        // Set appropriate ID field based on table
        if (event.tableName === 'products') {
          payload.productId = event.recordId;
        } else if (event.tableName === 'ingredients') {
          payload.ingredientId = event.recordId;
        } else if (event.tableName === 'categories') {
          payload.categoryId = event.recordId;
        }
        
        // Send webhook notification
        const success = await this.sendWebhookNotification(webhookConfig, payload);
        
        if (success) {
          await storage.updateWebhookEventStatus(eventId, 'sent');
          console.log(`✅ Webhook event ${eventId} sent successfully`);
        } else {
          const retryCount = (event.retryCount || 0) + 1;
          const maxRetries = 3;
          
          if (retryCount >= maxRetries) {
            await storage.updateWebhookEventStatus(eventId, 'failed', undefined, undefined, 'Maximum retry attempts reached');
            console.error(`❌ Webhook event ${eventId} failed after ${maxRetries} attempts`);
          } else {
            await storage.updateWebhookEventStatus(eventId, 'pending', undefined, undefined, 'Retry needed');
            console.log(`🔄 Webhook event ${eventId} scheduled for retry (attempt ${retryCount})`);
          }
        }
        
        return success;
      } catch (error) {
        console.error(`💥 Error processing webhook event ${eventId}:`, error);
        return false;
      }
    },

    async sendWebhookNotification(webhookConfig: any, payload: WebhookPayload): Promise<boolean> {
      try {
        console.log(`🚀 Sending webhook notification to ${webhookConfig.url} for ${payload.tableName} ${payload.action}`);
        
        const response = await fetch(webhookConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BurgerHouse-Webhook/1.0',
            ...(webhookConfig.secret ? { 'X-Webhook-Secret': webhookConfig.secret } : {})
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (!response.ok) {
          console.error(`❌ Webhook failed: HTTP ${response.status} ${response.statusText}`);
          return false;
        }
        
        console.log(`✅ Webhook notification sent successfully`);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('⏰ Webhook request timed out');
        } else {
          console.error('💥 Webhook connection failed:', error);
        }
        return false;
      }
    }
  };
}

// Create global webhook service instance
export const webhookNotificationService = createWebhookNotificationService();