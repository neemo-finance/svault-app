import { JsonRpcProvider, Wallet, Provider, Contract, Signer, formatUnits, ethers } from "ethers";
import { 
  elizaLogger, 
  IAgentRuntime, 
  IDatabaseAdapter
} from "@elizaos/core";
import sakeAbi from "../sake.abi.json";
import agentAbi from "../NeemoYieldAgentABIV2.abi.json";
import OpenAI from "openai";

// Enum representing the protocols supported by the contract.
export enum Protocol {
  SAKE = 1,
  UNTITLED = 2,
}

// Map from Protocol Name (string) to Protocol Number
export const protocolNameToNumber: ReadonlyMap<keyof typeof Protocol, Protocol> = new Map([
  ['SAKE', Protocol.SAKE],
  ['UNTITLED', Protocol.UNTITLED],
]);

// Map from Protocol Number to Protocol Name (string)
export const protocolNumberToName: ReadonlyMap<Protocol, keyof typeof Protocol> = new Map([
  [Protocol.SAKE, 'SAKE'],
  [Protocol.UNTITLED, 'UNTITLED'],
]);

// Types for APY responses
export interface UntitledAPYResponse {
  apy: string;
  // ...other fields as needed
}

export interface SakeAPYResponse {
  liquidityRate: string; // formatted percentage string
  // ...other fields as needed
}

// Types for current allocation
export interface AllocationStatus {
  protocol: keyof typeof Protocol;
  currentApy: number;
}

// --- Untitled APY Fetcher ---
export async function fetchUntitledAPY(): Promise<UntitledAPYResponse> {
  const url = process.env.UNTITLED_API_URL;
  if (!url) {
    throw new Error("UNTITLED_API_URL not set in environment variables.");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Untitled APY: ${response.statusText}`);
  }

  const responseData = await response.json();

  // Validate the structure and find the native APY
  if (
    !responseData ||
    !responseData.data ||
    !Array.isArray(responseData.data) ||
    responseData.data.length === 0
  ) {
    throw new Error("Invalid API response structure: Missing or empty 'data' array.");
  }

  const bankData = responseData.data[0];
  if (
    !bankData ||
    !bankData.apyDetails ||
    !Array.isArray(bankData.apyDetails)
  ) {
    throw new Error(
      "Invalid API response structure: Missing or invalid 'apyDetails' array in the first data item."
    );
  }

  const nativeApyDetail = bankData.apyDetails.find(
    (detail: any) => detail.name === "native-apy"
  );

  if (!nativeApyDetail || typeof nativeApyDetail.apy !== "number") {
    throw new Error(
      "Could not find 'native-apy' in apyDetails or its APY value is invalid."
    );
  }

  // Return the APY in the expected format
  return { apy: (nativeApyDetail.apy * 100).toFixed(2) };
}

// --- Sake APY Fetcher ---
export async function fetchSakeAPY(provider: JsonRpcProvider, sakeContractAddress: string, assetId: string): Promise<SakeAPYResponse> {
  // TODO: Implement fetch from Sake contract
  const contract = new Contract(sakeContractAddress, sakeAbi, provider);
  const reserveData = await contract.getReserveData(assetId);
  // Use 25 decimals for percentage conversion based on observed raw value
  const formattedRate = parseFloat(formatUnits(reserveData.liquidityRate, 25)).toFixed(2);
  return { liquidityRate: formattedRate };
}

// --- Current Allocation Fetcher ---
export async function getCurrentAllocation(provider: JsonRpcProvider, agentContractAddress: string): Promise<AllocationStatus> {
  const contract = new Contract(agentContractAddress, agentAbi.abi, provider);
  // Fetch position: [protocolId, tvl, currentApy]
  const [protocolIdBigInt, tvl, currentApy] = await contract.getCurrentPosition();
  const protocolId = Number(protocolIdBigInt); // Convert BigInt to number

  const protocolName = protocolNumberToName.get(protocolId);

  // Convert APY from BigInt to number
  const currentApyNumber = Number(currentApy);

  // TODO: Decide if tvl and currentApy should be returned/used.
  // For now, just returning the protocol name and ID based on contract data.
  return { protocol: protocolName, currentApy: (currentApyNumber * 0.01)};
}

// --- Rebalance Action ---
export async function rebalance(provider: JsonRpcProvider, agentContractAddress: string, newProtocolId: string, signer: Signer, apy?: number): Promise<void> {
  elizaLogger.info(`Starting rebalance to protocol ID: ${newProtocolId}`);
  
  try {
    // Create contract instance with signer
    const contract = new Contract(agentContractAddress, agentAbi.abi, signer);
    
    // Get the APY value if not provided (using current APY from the source protocol)
    if (apy === undefined) {
      const currentAllocation = await getCurrentAllocation(provider, agentContractAddress);
      // Convert APY to contract format (assuming APY is stored as a percentage * 100 in the contract)
      apy = Math.round(currentAllocation.currentApy * 100);
      elizaLogger.info(`No APY provided, using current APY: ${currentAllocation.currentApy}% (${apy} for contract)`);
    } else {
      elizaLogger.info(`Using provided APY: ${apy}`);
    }
    
    // Call the rebalance function on the smart contract with both newProtocolId and apy
    elizaLogger.info(`Submitting rebalance transaction to protocol ID: ${newProtocolId} with APY: ${apy}...`);
    const tx = await contract.rebalance(newProtocolId, apy);
    
    // Wait for transaction confirmation
    elizaLogger.info(`Transaction submitted: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    
    // Log successful rebalance
    elizaLogger.info(`Rebalance successful! Transaction confirmed with hash ${receipt.hash}`);

    return receipt.hash;
  } catch (error) {
    // Handle errors
    const errorMsg = (error as Error).message;
    elizaLogger.error(`Rebalance failed: ${errorMsg}`, error);
    throw new Error(`Failed to rebalance`);
  }
}

// --- Comparison Logic ---
export function shouldRebalance(
  current: keyof typeof Protocol, // Currently allocated protocol name ("UNTITLED" or "SAKE")
  currentAPY: number,           // APY of the current allocation (e.g., 1.85)
  untitledAPYString: string,    // APY from Untitled as a string (e.g., "0.03")
  sakeAPY: number               // APY from Sake (e.g., 1.67)
): keyof typeof Protocol | null {

  // Parse Untitled APY string to number
  const untitledAPY = parseFloat(untitledAPYString);
  if (isNaN(untitledAPY)) {
    // Handle error: If parsing fails, maybe log it and don't rebalance
    console.error("Failed to parse Untitled APY string:", untitledAPYString);
    return null;
  }

  let bestProtocol: keyof typeof Protocol | null = null;
  let bestApy = -Infinity; // Start with negative infinity

  // Determine the best available APY
  if (untitledAPY > sakeAPY) {
    bestProtocol = 'UNTITLED';
    bestApy = untitledAPY;
  } else {
    // If Sake is equal or greater, prefer Sake (or whichever is decided)
    bestProtocol = 'SAKE';
    bestApy = sakeAPY;
  }

  elizaLogger.info(`Current APY: ${currentAPY}% , Best APY found: ${bestApy}% (${bestProtocol})`);

  // Check if the best available APY is better than the current APY
  // AND if we are not already in the best protocol
  if (bestApy > currentAPY && bestProtocol !== current) {
    // It's better to switch
    return bestProtocol;
  }

  // Otherwise, no rebalance needed
  return null;
}

// --- History Logging with AI Summarization ---
async function generateReadableLog(runtime: IAgentRuntime, logEntry: string): Promise<string> {
  try {
    // Check if runtime is available
    if (!runtime) {
      elizaLogger.warn("Runtime not available for AI log generation, returning original log.");
      return logEntry;
    }
    
    // Create a proper prompt for the AI
    const prompt = `Convert the following yield optimizer log entry into a clear, concise human-readable summary. Focus on:
1. The current allocation and its APY
2. The APYs of different protocols (Untitled, Sake, etc.)
3. Whether a rebalance happened, and if so, from which protocol to which
4. Any errors that occurred
5. Action taken by the agent

Use natural language and make it easy for non-technical users to understand what happened. Keep it to 1-2 sentences.

Log Entry: "${logEntry}"`;
    
        // Initialize the OpenAI client with API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      elizaLogger.warn("OpenAI API key not found. Using original log entry.");
      return logEntry;
    }
    
    try {
      const openai = new OpenAI({ apiKey });
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes DeFi yield optimization logs into simple, readable formats. Dont add keywords like cycle, summary, etc." },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      const aiGeneratedText = response.choices[0]?.message?.content;
      
      if (aiGeneratedText) {
        elizaLogger.info("Successfully generated AI summary");
        return aiGeneratedText;
      } else {
        elizaLogger.info("Generated log summary without AI assistance");
        // Fallback to simple formatting
        return `Yield optimizer activity: ${logEntry.substring(0, 120)}...`;
      }
    } catch (aiError) {
      elizaLogger.error(`Error calling OpenAI API: ${aiError}`, aiError);
      // Fallback to simple formatting
      return `Yield optimizer activity: ${logEntry.substring(0, 120)}...`;
    }
  } catch (error) {
    elizaLogger.error(`Failed to generate readable log: ${error}`, error);
    return logEntry; // Fallback to original log on error
  }
}

// Updated to accept runtime and IDatabaseAdapter
export async function storeHistory(runtime: IAgentRuntime, databaseAdapter: IDatabaseAdapter, logEntry: string, tag: string): Promise<void> {
  try {
    elizaLogger.info(`Storing history log: [${tag}] ${logEntry}`);

    // Generate readable log entry using AI when possible, otherwise use original
    let readableLogEntry = logEntry;
    try {
      // Only attempt to generate readable log if runtime is available
      if (runtime) {
        const aiGenerated = await generateReadableLog(runtime, logEntry);
        if (aiGenerated && aiGenerated.trim().length > 0) {
          readableLogEntry = aiGenerated;
          elizaLogger.debug("Successfully generated readable log with AI");
        }
      }
    } catch (aiError) {
      // If AI generation fails, just use the original log and continue
      elizaLogger.warn(`AI log generation failed: ${aiError}, using original`);
    }

    // WORKAROUND: Assume databaseAdapter.db is a better-sqlite3 instance
    // The proper fix involves SqliteDatabaseAdapter returning a query builder via .db()
    const dbInstance = (databaseAdapter as any).db; // Cast to access raw db
    if (dbInstance && typeof dbInstance.prepare === 'function') {
      const sql = 'INSERT INTO yield_log (timestamp, log_entry, readable_log_entry, tag) VALUES (?, ?, ?, ?)';
      dbInstance.prepare(sql).run(
        Date.now(), 
        logEntry,
        readableLogEntry,
        tag
      );
      elizaLogger.debug(`Stored history log (Original & Readable with tag: ${tag})`);
    } else {
      elizaLogger.error("Could not store history log: databaseAdapter.db is not a compatible SQLite instance.");
    }

  } catch (error: any) { 
    // Improved error logging
    elizaLogger.error(`Failed to store history log for tag [${tag}]. Error: ${error?.message || error}`, error);
    // Log stack trace if available
    if (error instanceof Error && error.stack) {
      elizaLogger.debug(error.stack);
    }
  } 
}

// --- Autonomous Agent Loop (Entrypoint) ---
// Updated config type to include runtime
export async function runYieldOptimizerAgent(config: {
  provider: JsonRpcProvider;
  sakeContractAddress: string;
  sakeAbi: any;
  sakeAssetId: string;
  agentContractAddress: string;
  agentAbi: any;
  signer: Signer;
  intervalMs?: number;
  runtime: IAgentRuntime; // Added runtime to config
}): Promise<() => void> {
  // Validate configuration
  if (!config.provider) {
    throw new Error("Missing provider");
  }
  if (!config.sakeContractAddress) {
    throw new Error("Missing sakeContractAddress");
  }
  if (!config.sakeAssetId) {
    throw new Error("Missing sakeAssetId")
  }
  if (!config.agentContractAddress) {
    throw new Error("Missing agentContractAddress")
  }
  if (!config.signer) {
    throw new Error("Missing signer")
  }
  if (!config.runtime) { // Validate runtime
    throw new Error("Missing runtime");
  }
  // Optional: Validate intervalMs or use a default
  const intervalMs = config.intervalMs || parseInt(process.env.YIELD_OPTIMIZER_INTERVAL_MS || '300000', 10); // Default to 5 minutes

  let cycleCount = 0;
  let running = true;

  // Function to run a single optimization cycle
  // Updated to accept runtime
  const runOptimizationCycle = async (runtime: IAgentRuntime) => {
    cycleCount++;
    elizaLogger.info(`=== AUTONOMOUS AGENT: Starting yield optimization cycle #${cycleCount} ===`);
    let logMessage = `Cycle ${cycleCount} | Timestamp: ${Date.now()}`; // Start log message
    let rebalanceDecision: keyof typeof Protocol | null = null;
    let rebalanceError: string | null = null;

    
    try {
      // 1. Fetch current allocation
      elizaLogger.info(`Fetching current allocation from ${config.agentContractAddress}...`);
      const currentAllocation = await getCurrentAllocation(config.provider, config.agentContractAddress);
      elizaLogger.info(`Current allocation: ${currentAllocation.protocol} (APY: ${currentAllocation.currentApy})`);
      logMessage += ` | Current: ${currentAllocation.protocol} (${currentAllocation.currentApy}%)`;

      // 2. Fetch Untitled APY
      elizaLogger.info("Fetching Untitled APY...");
      const untitledResponse = await fetchUntitledAPY();
      const untitledAPY = parseFloat(untitledResponse.apy);
      elizaLogger.info(`Untitled APY: ${untitledAPY}%`);
      logMessage += ` | Untitled APY: ${untitledAPY}%`;

      // 3. Fetch Sake APY
      elizaLogger.info(`Fetching Sake APY from ${config.sakeContractAddress} for asset ${config.sakeAssetId}...`);
      const sakeResponse = await fetchSakeAPY(config.provider, config.sakeContractAddress, config.sakeAssetId);
      const sakeAPY = parseFloat(sakeResponse.liquidityRate);
      elizaLogger.info(`Sake APY: ${sakeAPY}%`);
      logMessage += ` | Sake APY: ${sakeAPY}%`;

      // 4. Compare and decide
      elizaLogger.info("Comparing APYs and determining optimal allocation...");
      const targetProtocol = shouldRebalance(currentAllocation.protocol, currentAllocation.currentApy, untitledAPY.toString(), sakeAPY);
      
      // 5. If needed, call rebalance
      if (targetProtocol !== null) {
        elizaLogger.info(`Rebalancing from ${currentAllocation.protocol} to ${targetProtocol}`);
        // Map protocol to ID: Untitled = 0, Sake = 1
        const targetProtocolId = protocolNameToNumber.get(targetProtocol);
        if (targetProtocolId) {
          // Determine the APY of the target protocol for the rebalance call
          let targetAPY: number;
          if (targetProtocol === 'UNTITLED') {
            // APY value from Untitled protocol
            targetAPY = untitledAPY;
          } else if (targetProtocol === 'SAKE') {
            // APY value from Sake protocol
            targetAPY = sakeAPY;
          } else {
            // Fallback to current APY if protocol is unknown
            targetAPY = currentAllocation.currentApy;
          }
          
          // Convert to the expected contract format (multiply by 100)
          const targetAPYForContract = Math.round(targetAPY * 100);
          elizaLogger.info(`Using ${targetProtocol} APY for rebalance: ${targetAPY}% (${targetAPYForContract} for contract)`);
          
          // Call rebalance with the protocol ID and APY
          const txhash = await rebalance(config.provider, config.agentContractAddress, targetProtocolId.toString(), config.signer, targetAPYForContract);
          elizaLogger.info("Rebalance complete!");
          logMessage += ` | Action: Rebalanced to ${targetProtocol} with APY ${targetAPY} and transaction hash ${txhash}`;
        } else {
          elizaLogger.error("Invalid target protocol");
          logMessage += ` | Action: Failed (invalid protocol)`;
        }
      } else {
        elizaLogger.info("No rebalance needed, current allocation is optimal.");
        logMessage += ` | Action: None`;
      }
      elizaLogger.info(`Yield optimization cycle #${cycleCount} completed successfully.`);
    } catch (error) {
      const errorMsg = (error as Error).message;
      elizaLogger.error(`Error in optimization cycle #${cycleCount}:`, error);
      rebalanceError = errorMsg; // Log general cycle error if it happens
      logMessage += ` | ERROR: ${errorMsg}`;
    } finally {
      // Store the constructed log message
      elizaLogger.info(logMessage); // Log to console regardless
      
      // Determine the appropriate tag based on whether a rebalance occurred
      const historyTag = logMessage.includes("Action: Rebalanced") ? "REBALANCED" : "MONITOR";
      
      // Store history with the appropriate tag, passing runtime and databaseAdapter
      if (runtime.databaseAdapter) {
        await storeHistory(runtime, runtime.databaseAdapter, logMessage, historyTag); // Pass runtime.databaseAdapter
      }
    }
  };

  // Run initial cycle immediately, passing runtime
  elizaLogger.info("=== AUTONOMOUS AGENT: Running initial optimization cycle ===");
  await runOptimizationCycle(config.runtime);
  
  // Set up interval for continuous monitoring
  elizaLogger.info(`Setting up autonomous monitoring at ${intervalMs}ms intervals...`);
  const intervalId = setInterval(async () => {
    if (running) {
      elizaLogger.info(`=== AUTONOMOUS AGENT: Timer triggered, running cycle #${cycleCount + 1} ===`);
      await runOptimizationCycle(config.runtime); // Pass runtime in interval
    }
  }, intervalMs);
  
  // Make sure the interval doesn't keep the process alive
  if (intervalId.unref) {
    intervalId.unref();
    elizaLogger.info("Interval unreferenced to prevent keeping process alive.");
  }
  
  elizaLogger.info("=== AUTONOMOUS AGENT: Yield optimizer agent initialized and running autonomously ====");
  
  // Return a cleanup function that can be called to stop the agent
  return () => {
    elizaLogger.info(`Stopping yield optimizer agent after ${cycleCount} cycles...`);
    running = false;
    clearInterval(intervalId);
    elizaLogger.info("Yield optimizer agent stopped.");
  };
}