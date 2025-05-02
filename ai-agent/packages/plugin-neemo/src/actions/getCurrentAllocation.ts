import { Action, IAgentRuntime } from "@elizaos/core";
import { getCurrentAllocation } from "../services";
import { validateYieldOptimizerConfig } from "../environment";

import { getCurrentAllocationExamples } from "../examples";

export const getCurrentAllocationAction: Action = {
  name: "getCurrentAllocation",
  description: "Fetch the current protocol allocation from the agent contract.",
  similes: ["GET_ALLOCATION", "GET_POSITION"],
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
    const contractAddress = options.contractAddress;
    const allocation = await getCurrentAllocation(provider, contractAddress as string);
    if (callback) {
      callback({ text: `Current allocation: ${allocation}` });
    }
    return allocation;
  },
  examples: getCurrentAllocationExamples,
};
