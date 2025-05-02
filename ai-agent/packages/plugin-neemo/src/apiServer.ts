import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

const PLUGIN_NAME = "Neemo Yield Optimizer API"; // Differentiate logging

let apiServerInstance: Server | null = null;

/**
 * Creates and starts the API server using Node's built-in HTTP module.
 * @param runtime The agent runtime environment.
 * @param port The port number to listen on.
 * @returns A function that can be called to stop the server
 */
export function startApiServer(runtime: IAgentRuntime, port: number): () => Promise<void> {
  elizaLogger.info(`${PLUGIN_NAME}: Starting API server on port ${port}...`);
  
  // Check if the server is already running
  if (apiServerInstance) {
    elizaLogger.warn(`${PLUGIN_NAME}: API server already running.`);
    // Return a dummy cleanup function
    return async () => {
      elizaLogger.warn(`${PLUGIN_NAME}: Attempted to stop an already running server via re-entrant call.`);
    };
  }

  try {
    // Create HTTP server with request handler
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // Add CORS headers to all responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        res.statusCode = 204; // No content
        res.end();
        return;
      }
      
      const url = req.url || '/';
      
      // Handle /logs endpoint
      if (url === '/logs' && req.method === 'GET') {
        try {
          // Get logs from database if available
          let logs = [];
          
          // Debug logs
          elizaLogger.info(`${PLUGIN_NAME}: Debug - runtime: ${runtime ? 'exists' : 'undefined'}`);
          elizaLogger.info(`${PLUGIN_NAME}: Debug - databaseAdapter: ${runtime?.databaseAdapter ? 'exists' : 'undefined'}`);
          elizaLogger.info(`${PLUGIN_NAME}: Debug - db: ${runtime?.databaseAdapter?.db ? 'exists' : 'undefined'}`);
          if (runtime?.databaseAdapter?.db) {
            elizaLogger.info(`${PLUGIN_NAME}: Debug - db type: ${typeof runtime.databaseAdapter.db}`);
            elizaLogger.info(`${PLUGIN_NAME}: Debug - db methods: ${Object.getOwnPropertyNames(runtime.databaseAdapter.db).join(', ')}`);
          }
          
          if (runtime.databaseAdapter && runtime.databaseAdapter.db) {
            try {
              logs = runtime.databaseAdapter.db.prepare('SELECT * FROM yield_log ORDER BY timestamp DESC LIMIT 100').all();
            } catch (dbError: any) {
              elizaLogger.error(`${PLUGIN_NAME}: Error querying database: ${dbError?.message || dbError}`);
              logs = [{ timestamp: Date.now(), message: 'Database error, check agent logs.' }];
            }
          } else {
            // Return mock data if no database connection
            logs = [{ timestamp: Date.now(), message: 'No database connection available.' }];
          }
          
          // Send JSON response
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(logs));
        } catch (error: any) {
          elizaLogger.error(`${PLUGIN_NAME}: Error fetching logs: ${error?.message || error}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch logs' }));
        }
      } else {
        // Handle 404 for any other route
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });
    
    // Store the server instance
    apiServerInstance = server;
    
    // Try to listen on the specified port
    // If port is in use, try the next port
    let actualPort = port;
    let portAttempts = 0;
    
    const startListening = () => {
      server.listen(actualPort, () => {
        elizaLogger.info(`${PLUGIN_NAME}: Log API server listening on http://localhost:${actualPort}/logs`);
      });
    };
    
    // Handle server errors (like port in use)
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && portAttempts < 5) {
        // If port is in use, try the next port
        portAttempts++;
        actualPort = port + portAttempts;
        elizaLogger.warn(`${PLUGIN_NAME}: Port ${port} is in use, trying ${actualPort}`);
        startListening();
      } else {
        elizaLogger.error(`${PLUGIN_NAME}: API server error: ${err.message}`);
        apiServerInstance = null;
      }
    });
    
    // Start listening
    startListening();
    
    // Define the cleanup function
    const cleanup = async (): Promise<void> => {
      if (apiServerInstance) {
        elizaLogger.info(`${PLUGIN_NAME}: Stopping API server...`);
        return new Promise<void>((resolve) => {
          apiServerInstance?.close((err) => {
            if (err) {
              elizaLogger.error(`${PLUGIN_NAME}: Error stopping API server: ${err.message}`);
            } else {
              elizaLogger.info(`${PLUGIN_NAME}: API server stopped successfully.`);
            }
            apiServerInstance = null;
            resolve();
          });
        });
      } else {
        elizaLogger.info(`${PLUGIN_NAME}: No active API server instance to stop.`);
        return Promise.resolve();
      }
    };
    
    return cleanup;
    
  } catch (error: any) {
    elizaLogger.error(`${PLUGIN_NAME}: Failed to start API server: ${error?.message || error}`);
    apiServerInstance = null;
    throw error;
  }
}
