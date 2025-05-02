import { ActionExample } from "@elizaos/core";

export const getUntitledAPYExamples: ActionExample[][] = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "What is the current APY on Untitled?",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Fetching the latest APY from Untitled...",
        action: "getUntitledAPY",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "The current Untitled APY is 4.2%.",
      },
    },
  ],
];

export const getSakeAPYExamples: ActionExample[][] = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "What's the Sake APY right now?",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Let me check Sake's latest APY...",
        action: "getSakeAPY",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Sake's current APY is 5.1%.",
      },
    },
  ],
];

export const getCurrentAllocationExamples: ActionExample[][] = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "Where are my funds currently allocated?",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Checking your current allocation...",
        action: "getCurrentAllocation",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Your funds are currently allocated to Untitled.",
      },
    },
  ],
];

export const rebalanceExamples: ActionExample[][] = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "Move my funds to the provider with the highest APY.",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Comparing yields and rebalancing if needed...",
        action: "rebalance",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Funds rebalanced to Sake for optimal yield.",
      },
    },
  ],
];

export const moveFundsExamples: ActionExample[][] = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "Move all funds to Untitled now.",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Moving funds to Untitled...",
        action: "moveFunds",
      },
    },
    {
      user: "{{agent}}",
      content: {
        text: "Funds successfully moved to Untitled.",
      },
    },
  ],
];