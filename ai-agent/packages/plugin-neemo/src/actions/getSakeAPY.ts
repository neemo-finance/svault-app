import { Action, IAgentRuntime } from "@elizaos/core";
import { fetchSakeAPY } from "../services";
import { getSakeAPYExamples } from "../examples";
import { validateYieldOptimizerConfig } from "../environment";

export const getSakeAPYAction: Action = {
  name: "getSakeAPY",
  description: "Fetch the current APY from Sake contract.",
  similes: ["GET_APY_SAKE", "GET_YIELD_SAKE"],
  validate: async (runtime: IAgentRuntime) => {
    await validateYieldOptimizerConfig(runtime);
    return true;
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message,
    _state,
    options,
    callback
  ) => {
    const provider = options.provider;
    const contractAddress = options.contractAddress as string;
    const assetId = options.assetId as string;
    const apyData = await fetchSakeAPY(provider, contractAddress, assetId);
    if (callback) {
      callback({ text: `Current Sake APY: ${apyData}` });
    }
    return apyData;
  },
  examples: getSakeAPYExamples,
};
