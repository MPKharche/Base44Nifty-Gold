import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68133f4dbcb69a89c7914d86", 
  requiresAuth: true // Ensure authentication is required for all operations
});
