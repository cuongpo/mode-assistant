import { Service, IAgentRuntime, ServiceType } from '@elizaos/core';
import axios from 'axios';

export class ModeQueryService implements Service {
  private readonly BLOCKSCOUT_API = 'https://explorer.mode.network/api';
  private static instance: ModeQueryService | null = null;

  static getInstance(): ModeQueryService {
    if (!ModeQueryService.instance) {
      ModeQueryService.instance = new ModeQueryService();
    }
    return ModeQueryService.instance;
  }

  getName(): string {
    return '@elizaos/plugin-mode-query';
  }

  get serviceType(): ServiceType {
    return ServiceType.BROWSER;
  }

  async initialize(_runtime: IAgentRuntime): Promise<void> {
    // Initialize any necessary setup
  }

  async getAddressBalance(address: string) {
    try {
      const response = await axios.get(`${this.BLOCKSCOUT_API}/v2/addresses/${address}`);
      return {
        address,
        balance: response.data.coin_balance,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch balance for address ${address}: ${error.message}`);
    }
  }

  async getLatestBlock() {
    try {
      const response = await axios.get(`${this.BLOCKSCOUT_API}/v2/blocks/latest`);
      return {
        blockNumber: response.data.height,
        timestamp: response.data.timestamp,
        hash: response.data.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch latest block: ${error.message}`);
    }
  }

  async getTransactionsByAddress(address: string) {
    try {
      const response = await axios.get(`${this.BLOCKSCOUT_API}/v2/addresses/${address}/transactions`);
      return {
        address,
        transactions: response.data.items,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch transactions for address ${address}: ${error.message}`);
    }
  }
}