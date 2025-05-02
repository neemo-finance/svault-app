import { Client, Plugin, elizaLogger, IAgentRuntime } from "@elizaos/core";
import { getUntitledAPYAction } from "./actions/getUntitledAPY";
import { getSakeAPYAction } from "./actions/getSakeAPY";
import { getCurrentAllocationAction } from "./actions/getCurrentAllocation";
import { moveFundsAction } from "./actions/moveFunds";
import { runYieldOptimizerAgent } from "./services";
import sakeAbi from "../sake.abi.json";
import agentAbi from "../NeemoYieldAgentABIV2.abi.json";
import { JsonRpcProvider, Wallet, ethers } from "ethers";
import { startApiServer } from './apiServer';

// Global variables to hold the cleanup functions
let stopYieldOptimizerAgent: (() => void) | null = null;
let stopApiServerCleanup: (() => Promise<void>) | null = null;

// Define the autonomous client
const yieldOptimizerClient: Client = {
  name: "yield-optimizer-client",


  async start(runtime: IAgentRuntime) {
    try {
      elizaLogger.info("=== AUTONOMOUS AGENT: Starting Neemo Yield Optimizer agent ===");
      
      // Ensure runtime is fully initialized before accessing services
      await runtime.initialize();

      
      // Log all settings to help with debugging
      const providerUrl = process.env.RPC_URL ?? runtime.getSetting("EVM_PROVIDER_URL");
      const privateKey = process.env.PRIVATE_KEY ?? runtime.getSetting("EVM_PRIVATE_KEY");
      const sakeContractAddress = process.env.SAKE_CONTRACT_ADDRESS ?? runtime.getSetting("SAKE_CONTRACT_ADDRESS");
      const sakeAssetId = process.env.SAKE_ASSET_ID ?? runtime.getSetting("SAKE_ASSET_ID");
      const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS ?? runtime.getSetting("AGENT_CONTRACT_ADDRESS");
      
      elizaLogger.info('Services enabled: ', runtime.services);

      // Validate required settings
      if (!providerUrl) elizaLogger.error("Missing RPC_URL/EVM_PROVIDER_URL setting");
      if (!privateKey) elizaLogger.error("Missing PRIVATE_KEY/EVM_PRIVATE_KEY setting");
      if (!sakeContractAddress) elizaLogger.error("Missing SAKE_CONTRACT_ADDRESS setting");
      if (!sakeAssetId) elizaLogger.error("Missing SAKE_ASSET_ID setting");
      if (!agentContractAddress) elizaLogger.error("Missing AGENT_CONTRACT_ADDRESS setting");
      // Log connected wallet
      if (!privateKey) {
        elizaLogger.error('EVM_PRIVATE_KEY environment variable not set.');
        return; // Exit if key is missing
      }
      try {
            const wallet = new ethers.Wallet(privateKey);
            elizaLogger.info(`=== AUTONOMOUS AGENT: Connected Wallet Address: ${wallet.address} ===`);
          } catch (error: any) {
             elizaLogger.error(`=== AUTONOMOUS AGENT: Error deriving wallet from private key: ${error.message} ===`);
             return; // Exit on error
          }
      
      elizaLogger.info(`Provider URL: ${providerUrl ? '✓ Set' : '✗ Missing'}`);
      elizaLogger.info(`Private Key: ${privateKey ? '✓ Set' : '✗ Missing'}`);
      elizaLogger.info(`Sake Contract: ${sakeContractAddress ? '✓ Set' : '✗ Missing'}`);
      elizaLogger.info(`Sake Asset ID: ${sakeAssetId ? '✓ Set' : '✗ Missing'}`);
      elizaLogger.info(`Agent Contract: ${agentContractAddress ? '✓ Set' : '✗ Missing'}`);
      
      // Initialize provider and signer
      const provider = new JsonRpcProvider(providerUrl);
      const signer = new Wallet(privateKey as string, provider);
      
      // Test provider connection
      try {
        const blockNumber = await provider.getBlockNumber();
        elizaLogger.info(`Connected to blockchain, current block: ${blockNumber}`);
      } catch (error) {
        elizaLogger.error("Failed to connect to blockchain provider:", error);
      }
      
      // Get interval from environment variable, runtime settings, or use default
      const intervalMsStr = process.env.YIELD_OPTIMIZER_INTERVAL_MS ?? runtime.getSetting("YIELD_OPTIMIZER_INTERVAL_MS");
      const intervalMs = intervalMsStr ? parseInt(intervalMsStr) : 60000; // Default: 1 minute
      
      elizaLogger.info(`=== AUTONOMOUS AGENT: Using interval of ${intervalMs}ms (${intervalMs/1000} seconds) ===`);
      
      // Get Database Client from runtime
      const dbClient = runtime.databaseAdapter;
      if (!dbClient) {
        elizaLogger.error("Database adapter not found on runtime. History logging will be disabled.");
        throw new Error("Database adapter not found."); // Throw error to prevent starting without DB
      }
      elizaLogger.info("Successfully obtained database adapter from runtime.");

      // Start the agent and store the cleanup function
      elizaLogger.info("=== AUTONOMOUS AGENT: Initializing yield optimizer agent ===");
      const cleanup = await runYieldOptimizerAgent({
        provider,
        sakeContractAddress,
        sakeAbi,
        sakeAssetId,
        agentContractAddress,
        agentAbi: agentAbi.abi, // Pass the ABI array
        signer,
        // dbClient,
        runtime, // Pass the runtime object here
        intervalMs,
      });
      
      // Store the cleanup function
      stopYieldOptimizerAgent = cleanup;
      
      elizaLogger.info("=== AUTONOMOUS AGENT: Neemo Yield Optimizer agent started successfully! ===");
    } catch (error) {
      elizaLogger.error("Failed to start Neemo Yield Optimizer agent or API server:", error);
    }
    
    // Return the client instance with stop functionality
    return {
      // Method to manually start the API server
      startApiServer: async (port?: number) => {
        try {
          // Get API port from parameter, environment variable, runtime setting, or use default
          const apiPortStr = port?.toString() || process.env.YIELD_OPTIMIZER_API_PORT || runtime.getSetting("YIELD_OPTIMIZER_API_PORT");
          const apiPort = apiPortStr ? parseInt(apiPortStr.toString()) : 3000; // Default port 3000
          
          // Start the API server
          elizaLogger.info(`Manually starting Neemo Yield Optimizer API server on port ${apiPort}...`);
          stopApiServerCleanup = startApiServer(runtime, apiPort); // Start the API server
          elizaLogger.info("Neemo Yield Optimizer API server started successfully!");
          return stopApiServerCleanup;
        } catch (error) {
          elizaLogger.error("Failed to start Neemo Yield Optimizer API server:", error);
          throw error; // Re-throw the error
        }
      },
      
      // Method to stop both the agent and API server if running
      stop: async () => {
        elizaLogger.info("Stopping Neemo Yield Optimizer agent and API server...");
        
        // Stop the main agent logic first
        if (stopYieldOptimizerAgent) {
          stopYieldOptimizerAgent();
          stopYieldOptimizerAgent = null;
          elizaLogger.info("Neemo Yield Optimizer agent stopped successfully!");
        } else {
          elizaLogger.info("No running Neemo Yield Optimizer agent to stop.");
        }
        
        // Stop the API server if it was manually started
        if (stopApiServerCleanup) {
          try {
            await stopApiServerCleanup();
            stopApiServerCleanup = null;
            elizaLogger.info("Neemo Yield Optimizer API server stopped successfully!");
          } catch (error) {
            elizaLogger.error("Error stopping API server:", error);
          }
        } else {
          elizaLogger.info("No running Neemo Yield Optimizer API server to stop.");
        }
      }
    };
  }
};

// Define the plugin with both actions and the autonomous client
export const yieldOptimizerPlugin: Plugin = {
  name: "yield-optimizer",
  description: "Autonomous agent for optimizing yield between Untitled and Sake.",
  actions: [
    getUntitledAPYAction,
    getSakeAPYAction,
    getCurrentAllocationAction,
    moveFundsAction,
  ],
  evaluators: [],
  providers: [],
  adapters: [],
  clients: [yieldOptimizerClient]
};

export default yieldOptimizerPlugin;