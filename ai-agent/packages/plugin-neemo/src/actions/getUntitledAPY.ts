
import { Action, IAgentRuntime } from "@elizaos/core";
import { fetchUntitledAPY } from "../services";
import { validateYieldOptimizerConfig } from "../environment";
import { getUntitledAPYExamples } from "../examples";

export const getUntitledAPYAction: Action = {
  name: "getUntitledAPY",
  description: "Fetch the current APY from Untitled API.",
  similes: ["GET_APY", "GET_YIELD"],
  validate: async (_runtime: IAgentRuntime) => {
    await validateYieldOptimizerConfig(_runtime);
    return true;
  },
  handler: async (_runtime, _message, _state, options, callback) => {
    // Example type check for future options usage
    // if (typeof options?.someParam !== 'string') throw new Error('someParam must be a string');
    const apyData = await fetchUntitledAPY();
    if (callback) {
      callback({ text: `Current Untitled APY: ${typeof apyData === 'object' && apyData !== null && 'apy' in apyData ? apyData.apy : apyData}` });
    }
    return apyData;
  },
  examples: getUntitledAPYExamples,
};
