import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const yieldOptimizerEnvSchema = z.object({
  UNTITLED_API_URL: z.string().url(),
  SAKE_CONTRACT_ADDRESS: z.string().min(1, "Sake contract address is required"),
  SAKE_ASSET_ID: z.string().min(1, "Sake asset ID is required"),
  AGENT_CONTRACT_ADDRESS: z.string().min(1, "Agent contract address is required"),
  EVM_PRIVATE_KEY: z.string().min(1, "Private key is required for signing transactions"),
  EVM_PROVIDER_URL: z.string().url(),
});

export type YieldOptimizerConfig = z.infer<typeof yieldOptimizerEnvSchema>;

export async function validateYieldOptimizerConfig(
  runtime: IAgentRuntime
): Promise<YieldOptimizerConfig> {
    try {
        const config = {
            UNTITLED_API_URL: runtime.getSetting("UNTITLED_API_URL"),
            SAKE_CONTRACT_ADDRESS: runtime.getSetting("SAKE_CONTRACT_ADDRESS"),
            SAKE_ASSET_ID: runtime.getSetting("SAKE_ASSET_ID"),
            AGENT_CONTRACT_ADDRESS: runtime.getSetting("AGENT_CONTRACT_ADDRESS"),
            EVM_PRIVATE_KEY: runtime.getSetting("EVM_PRIVATE_KEY"),
            EVM_PROVIDER_URL: runtime.getSetting("EVM_PROVIDER_URL"),
        };
        console.log('config: ', config)
        return yieldOptimizerEnvSchema.parse(config);
    } catch (error) {
        console.log("error::::", error)
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Yield Optimizer agent configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}