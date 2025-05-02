// Types for Untitled and Sake APY responses
export interface UntitledAPYResponse {
  apy: number;
  // ...other fields as needed
}

export interface SakeAPYResponse {
  liquidityRate: string; // BigNumber string
  // ...other fields as needed
}

export enum Protocol {
  Untitled = "untitled",
  Sake = "sake"
}

export interface AllocationStatus {
  protocol: Protocol;
  protocolId: string | number;
}