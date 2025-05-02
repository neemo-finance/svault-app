import { startApiServer } from './apiServer';
import { elizaLogger, IAgentRuntime } from '@elizaos/core';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Standalone script to run the Neemo Yield Optimizer API server
 * without starting the full agent.
 */
async function startApiServerStandalone() {
  // Try to get the runtime from global scope first
  // @ts-ignore - Runtime might be set by the ElizaOS framework
  let runtime = global.elizaRuntime as IAgentRuntime;
  
  // If no global runtime is available, create a minimal one for standalone mode
  if (!runtime) {
    elizaLogger.info('No global ElizaOS runtime found, creating standalone runtime');
    
    // Set up the database path - use @agent/data path
    const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), '../..', 'agent/data/db.sqlite');
    elizaLogger.info(`Connecting to existing database at: ${dbPath}`);
    
    try {
      // Check if database file exists
      if (!fs.existsSync(dbPath)) {
        elizaLogger.warn(`Database file not found at: ${dbPath}, API server will run with limited functionality`);
      } else {
        elizaLogger.info('Database file found, connecting...');
      }
      
      // Create a minimal runtime with database support if available
      const db = fs.existsSync(dbPath) ? new Database(dbPath) : null;
      
      // Create a minimal runtime with only the properties needed by the API server
      // We use unknown as an intermediate casting step to avoid TypeScript errors
      // since we're not implementing the full IAgentRuntime interface
      runtime = {
        // Add the database adapter with the required db property
        databaseAdapter: {
          db, // This is the key property that apiServer.ts is looking for
          // We're not implementing all IDatabaseAdapter methods since they're not needed
          // for the standalone API server
        },
        getSetting: (key: string) => process.env[key] || null,
        log: elizaLogger
      } as unknown as IAgentRuntime;
      
      elizaLogger.info('Standalone runtime created successfully');
    } catch (error) {
      elizaLogger.error('Failed to create standalone runtime:', error);
      process.exit(1);
    }
  } else {
    elizaLogger.info('Using existing ElizaOS runtime');
  }

  // Get port from environment variable or use default
  const port = process.env.YIELD_OPTIMIZER_API_PORT 
    ? parseInt(process.env.YIELD_OPTIMIZER_API_PORT) 
    : 3000; // Default port

  elizaLogger.info(`Starting Neemo Yield Optimizer API server on port ${port}...`);

  // Ensure we have necessary environment variables
  elizaLogger.info('Checking configuration...');

  try {
    elizaLogger.info('Runtime environment configured');
    
    // Start the API server
    const stopServer = startApiServer(runtime, port);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      elizaLogger.info('Received SIGINT signal. Shutting down API server...');
      await stopServer();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      elizaLogger.info('Received SIGTERM signal. Shutting down API server...');
      await stopServer();
      process.exit(0);
    });

    elizaLogger.info(`API server started successfully. View logs at http://localhost:${port}/logs`);
    elizaLogger.info('Press Ctrl+C to stop.');
  } catch (error) {
    elizaLogger.error('Failed to start API server:', error);
    process.exit(1);
  }
}

// Run the standalone server
startApiServerStandalone().catch(error => {
  elizaLogger.error('Unhandled error:', error);
  process.exit(1);
});
