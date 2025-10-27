import type { Response } from "express";

// Store active SSE connections
const clients = new Set<Response>();

export function addClient(res: Response) {
  clients.add(res);
  console.log(`📡 New SSE client connected. Total clients: ${clients.size}`);
  
  // Remove client when connection closes
  res.on('close', () => {
    clients.delete(res);
    console.log(`📡 SSE client disconnected. Total clients: ${clients.size}`);
  });
}

export function notifyClients(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  console.log(`📢 Notifying ${clients.size} clients about: ${event}`, data);
  
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('❌ Error writing to client:', error);
    }
  });
}

// Notify when bale is created, updated, or deleted
export function notifyBaleChange() {
  console.log('🔔 notifyBaleChange() called');
  notifyClients('bale-update', { timestamp: Date.now() });
}
