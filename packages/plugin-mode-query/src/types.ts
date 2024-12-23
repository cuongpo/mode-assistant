export interface BlockInfo {
    blockNumber: string;
    timestamp: string;
    hash: string;
  }

  export interface AddressBalance {
    address: string;
    balance: string;
    timestamp: string;
  }

  export interface TransactionInfo {
    address: string;
    transactions: any[];
    timestamp: string;
  }