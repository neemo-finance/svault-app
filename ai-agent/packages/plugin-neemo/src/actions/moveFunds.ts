import { Action } from "@elizaos/core";
import { rebalance } from "../services";
import { validateYieldOptimizerConfig } from "../environment";
import { moveFundsExamples } from "../examples";
import { JsonRpcProvider, Signer } from "ethers";

export const moveFundsAction: Action = {
  name: "moveFunds",
  description: "Move funds to a specific protocol (alias for rebalance).",
  similes: ["MOVE_FUNDS", "TRANSFER_FUNDS"],
  validate: async (runtime) => {
    await validateYieldOptimizerConfig(runtime);
    return true;
  },
  handler: async (_runtime, _message, _state, options, callback) => {
    const { provider, contractAddress, newProtocolId, signer, apy } = options || {};
    if (!provider) throw new Error("provider is required");
    if (typeof contractAddress !== 'string') throw new Error("contractAddress must be a string");
    if (typeof newProtocolId !== 'string' && typeof newProtocolId !== 'number') throw new Error("newProtocolId must be a string or number");
    if (!signer) throw new Error("signer is required");
    
    // APY is optional, pass it along if provided
    await rebalance(
      provider as JsonRpcProvider, 
      contractAddress, 
      newProtocolId as string, 
      signer as Signer,
      typeof apy === 'number' ? apy : undefined
    );
    
    if (callback) {
      callback({ text: `Funds successfully moved to protocol ${newProtocolId}.` });
    }
    return { success: true };
  },
  examples: moveFundsExamples,
};
