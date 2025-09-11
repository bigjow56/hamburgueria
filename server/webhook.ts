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
  processWebhookEventWithUrl: (eventId: string, webhookUrl: string) => Promise<boolean>;
  sendWebhookNotification: (webhookConfig: any, payload: WebhookPayload) => Promise<boolean>;
  sendWebhookNotificationToUrl: (webhookUrl: string, payload: WebhookPayload) => Promise<boolean>;
}

// Sanitize product data to remove sensitive information
function sanitizeProductData(productData: any): any {
  if (!productData) return null;
  
  // Only include safe, non-sensitive fields
  const safeFields = ['id', 'name', 'categoryId', 'price', 'isAvailable', 'description'];
  const sanitized: any = {};
  
  for (const field of safeFields) {
    if (productData[field] !== undefined) {
      sanitized[field] = productData[field];
    }
  }
  
  return sanitized;
}

// Legacy function kept for backwards compatibility - now delegates to DB-driven system
export async function notifyProductChange(action: 'create' | 'update' | 'delete', productId: string, productData?: any) {
  console.log(`📋 Legacy notifyProductChange called for product ${action} (ID: ${productId})`);
  
  // Use the new database-driven system
  await storage.notifyWebhookChange(
    'products', 
    action.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE', 
    productId, 
    action === 'delete' ? productData : null, // oldData for delete
    action === 'delete' ? null : productData  // newData for create/update
  );
  
  // Legacy environment variable approach - only use if explicitly enabled to avoid duplication
  const webhookUrl = process.env.N8N_URL_MENU;
  const enableLegacyWebhook = process.env.ENABLE_LEGACY_WEBHOOK === 'true';
  
  if (webhookUrl && enableLegacyWebhook) {
    try {
      const sanitizedData = sanitizeProductData(productData);
      const payload: WebhookPayload = {
        action,
        productId,
        tableName: 'products',
        recordId: productId,
        recordData: sanitizedData,
        timestamp: new Date().toISOString()
      };

      console.log(`🚀 Sending legacy webhook for product ${action} (ID: ${productId})`);
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BurgerHouse-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`⚠️ Legacy webhook failed for product ${action} (ID: ${productId})`);
    }
  } else if (webhookUrl && !enableLegacyWebhook) {
    console.log(`⏭️ Legacy webhook available but disabled via ENABLE_LEGACY_WEBHOOK flag`);
  }
}

// Enhanced data sanitization for different table types
function sanitizeData(tableName: string, data: any): any {
  if (!data) return null;
  
  const sanitizedData: any = {};
  
  switch (tableName) {
    case 'products':
      const productSafeFields = ['id', 'name', 'categoryId', 'price', 'isAvailable', 'description'];
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
        
        // Check if we should use environment variable URL instead of DB configs
        const n8nTriggerUrl = process.env.N8N_TRIGGER_URL;
        
        if (n8nTriggerUrl) {
          console.log(`🌐 Using N8N_TRIGGER_URL: ${n8nTriggerUrl}`);
          // Process all pending events using the environment URL
          const pendingEvents = await storage.getPendingWebhookEvents();
          
          if (pendingEvents.length === 0) {
            console.log('📭 No pending webhook events to process');
            return;
          }
          
          console.log(`📋 Found ${pendingEvents.length} pending webhook events`);
          
          for (const event of pendingEvents) {
            try {
              await this.processWebhookEventWithUrl(event.id, n8nTriggerUrl);
            } catch (error) {
              console.error(`❌ Failed to process webhook event ${event.id}:`, error);
            }
          }
        } else {
          console.log('🗄️ Using database webhook configurations');
          // Original database-driven approach
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
        
        if (event.status !== 'pending' && event.status !== 'retry') {
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
        
        // Detect product availability changes for special notification
        const op = (event.operationType || '').toUpperCase();
        if (event.tableName === 'products' && op === 'UPDATE' && event.oldData && event.newData) {
          // Parse JSON if data comes as string, otherwise use as object
          const oldObj = typeof event.oldData === 'string' ? JSON.parse(event.oldData) : (event.oldData || {});
          const newObj = typeof event.newData === 'string' ? JSON.parse(event.newData) : (event.newData || {});
          
          const wasAvailable = oldObj.isAvailable ?? oldObj.is_available ?? true;
          const isNowAvailable = newObj.isAvailable ?? newObj.is_available ?? true;
          
          console.log(`🔍 DEBUG: op=${op}, oldAvailable=${wasAvailable}, newAvailable=${isNowAvailable}`);
          
          if (wasAvailable && !isNowAvailable) {
            (payload as any).productBecameUnavailable = true;
            (payload as any).availabilityChange = {
              from: 'available',
              to: 'unavailable',
              productName: newObj.name || oldObj.name,
              timestamp: payload.timestamp
            };
            console.log(`🚨 PRODUTO INDISPONÍVEL: ${newObj.name || event.recordId} foi marcado como esgotado`);
          } else if (!wasAvailable && isNowAvailable) {
            (payload as any).productBecameAvailable = true;
            (payload as any).availabilityChange = {
              from: 'unavailable', 
              to: 'available',
              productName: newObj.name || oldObj.name,
              timestamp: payload.timestamp
            };
            console.log(`✅ PRODUTO DISPONÍVEL: ${newObj.name || event.recordId} voltou a estar disponível`);
          }
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
            // Use 'retry' status to trigger the retryCount increment logic in storage
            await storage.updateWebhookEventStatus(eventId, 'retry', undefined, undefined, `Retry attempt ${retryCount}`);
            console.log(`🔄 Webhook event ${eventId} scheduled for retry (attempt ${retryCount})`);
          }
        }
        
        return success;
      } catch (error) {
        console.error(`💥 Error processing webhook event ${eventId}:`, error);
        return false;
      }
    },

    async processWebhookEventWithUrl(eventId: string, webhookUrl: string): Promise<boolean> {
      try {
        const event = await storage.getWebhookEvent(eventId);
        if (!event) {
          console.error(`⚠️ Webhook event ${eventId} not found`);
          return false;
        }
        
        if (event.status !== 'pending' && event.status !== 'retry') {
          console.log(`⏭️ Webhook event ${eventId} already processed (status: ${event.status})`);
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
        
        // Detect product availability changes for special notification
        const op = (event.operationType || '').toUpperCase();
        if (event.tableName === 'products' && op === 'UPDATE' && event.oldData && event.newData) {
          // Parse JSON if data comes as string, otherwise use as object
          const oldObj = typeof event.oldData === 'string' ? JSON.parse(event.oldData) : (event.oldData || {});
          const newObj = typeof event.newData === 'string' ? JSON.parse(event.newData) : (event.newData || {});
          
          const wasAvailable = oldObj.isAvailable ?? oldObj.is_available ?? true;
          const isNowAvailable = newObj.isAvailable ?? newObj.is_available ?? true;
          
          console.log(`🔍 DEBUG: op=${op}, oldAvailable=${wasAvailable}, newAvailable=${isNowAvailable}`);
          
          if (wasAvailable && !isNowAvailable) {
            (payload as any).productBecameUnavailable = true;
            (payload as any).availabilityChange = {
              from: 'available',
              to: 'unavailable',
              productName: newObj.name || oldObj.name,
              timestamp: payload.timestamp
            };
            console.log(`🚨 PRODUTO INDISPONÍVEL: ${newObj.name || event.recordId} foi marcado como esgotado`);
          } else if (!wasAvailable && isNowAvailable) {
            (payload as any).productBecameAvailable = true;
            (payload as any).availabilityChange = {
              from: 'unavailable', 
              to: 'available',
              productName: newObj.name || oldObj.name,
              timestamp: payload.timestamp
            };
            console.log(`✅ PRODUTO DISPONÍVEL: ${newObj.name || event.recordId} voltou a estar disponível`);
          }
        }

        // Send webhook notification using environment URL
        const success = await this.sendWebhookNotificationToUrl(webhookUrl, payload);
        
        if (success) {
          await storage.updateWebhookEventStatus(eventId, 'sent');
          console.log(`✅ Webhook event ${eventId} sent successfully to ${webhookUrl}`);
        } else {
          const retryCount = (event.retryCount || 0) + 1;
          const maxRetries = 3;
          
          if (retryCount >= maxRetries) {
            await storage.updateWebhookEventStatus(eventId, 'failed', undefined, undefined, 'Maximum retry attempts reached');
            console.error(`❌ Webhook event ${eventId} failed after ${maxRetries} attempts`);
          } else {
            // Use 'retry' status to trigger the retryCount increment logic in storage
            await storage.updateWebhookEventStatus(eventId, 'retry', undefined, undefined, `Retry attempt ${retryCount}`);
            console.log(`🔄 Webhook event ${eventId} scheduled for retry (attempt ${retryCount})`);
          }
        }
        
        return success;
      } catch (error) {
        console.error(`💥 Error processing webhook event ${eventId}:`, error);
        return false;
      }
    },

    async sendWebhookNotificationToUrl(webhookUrl: string, payload: WebhookPayload): Promise<boolean> {
      try {
        console.log(`🚀 Sending webhook notification to ${webhookUrl} for ${payload.tableName} ${payload.action}`);
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BurgerHouse-Webhook/1.0'
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