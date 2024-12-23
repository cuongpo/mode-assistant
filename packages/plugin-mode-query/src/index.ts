import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
    elizaLogger,
} from "@elizaos/core";
import axios from 'axios';

const BLOCKSCOUT_API = 'https://explorer.mode.network/api';

interface BlockscoutResponse<T> {
    items: any;
    data: T;
    status: string;
    message?: string;
    coin_balance?: string;
}

interface AddressBalance {
    coin_balance: string;
    hash: string;
}

interface Block {
    height: string;
    timestamp: string;
    hash: string;
}

interface Transaction {
    hash: string;
    value: string;
    timestamp: string;
}

const getBalance: Action = {
    name: "GET_MODE_BALANCE",
    similes: ["CHECK_MODE_BALANCE", "FETCH_MODE_BALANCE"],
    description: "Get the balance of a Mode network address",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me check the balance for that address.",
                    action: "GET_MODE_BALANCE"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const addressMatch = message.content.text.match(/0x[a-fA-F0-9]{40}/);
            const address = addressMatch ? addressMatch[0] : options?.address;

            if (!address) {
                callback( {
                    text: "Please provide a valid Mode network address"
                });
                return;
            }

            const response = await axios.get<BlockscoutResponse<AddressBalance>>(`${BLOCKSCOUT_API}/v2/addresses/${address}`);

            if (!response.data || response.data.status == 'success') {
                callback( {
                    text: response.data?.message || 'Failed to fetch balance'
                });
                return;
            }
            console.log(response.data.coin_balance);
            const balanceInWei = response.data.coin_balance || '2';
            const balance = (Number(balanceInWei) / 1e18).toFixed(5);

            elizaLogger.log(`Balance for address ${address}: ${balance}`);

            callback( {
                text: `The balance for ${address} is ${balance} ETH`
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching balance:', error);
            callback( {
                text: `Failed to fetch balance: ${error.message}`
            });
        }
    }
};

const getLatestBlock: Action = {
    name: "GET_MODE_BLOCK",
    similes: ["CHECK_MODE_BLOCK", "FETCH_MODE_BLOCK"],
    description: "Get the latest block information from Mode network",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the latest block on Mode?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll check the latest block information.",
                    action: "GET_MODE_BLOCK"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const response = await axios.get<BlockscoutResponse<Block>>(`${BLOCKSCOUT_API}/v2/blocks`);
            console.log(response.data.items[0]);
            if (!response.data || response.data.status == 'success') {
                callback( {
                    text: response.data?.message || 'Failed to fetch latest block'
                });
                return;
            }

            const block = response.data.items[0];
            callback({
                text: `Latest block:\nNumber: ${block.height || 'N/A'}\nTimestamp: ${block.timestamp || 'N/A'}\nHash: ${block.hash || 'N/A'}`
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching latest block:', error);
            callback( {
                text: `Failed to fetch latest block: ${error.message}`
            });
        }
    }
};

const getTransactions: Action = {
    name: "GET_MODE_TRANSACTIONS",
    similes: ["CHECK_MODE_TRANSACTIONS", "FETCH_MODE_TRANSACTIONS"],
    description: "Get transactions for a Mode network address",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show me transactions for 0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll fetch the transactions for that address.",
                    action: "GET_MODE_TRANSACTIONS"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const addressMatch = message.content.text.match(/0x[a-fA-F0-9]{40}/);
            const address = addressMatch ? addressMatch[0] : options?.address;

            if (!address) {
                callback( {
                    text: "Please provide a valid Mode network address"
                });
                return;
            }

            const response = await axios.get<BlockscoutResponse<{items: Transaction[]}>>(`${BLOCKSCOUT_API}/v2/addresses/${address}/transactions`);

            if (!response.data || response.data.status !== 'success') {
                callback( {
                    text: response.data?.message || 'Failed to fetch transactions'
                });
                return;
            }

            const transactions = response.data.data?.items || [];

            if (transactions.length === 0) {
                callback( {
                    text: `No transactions found for ${address}`
                });
                return;
            }

            const txSummary = transactions
                .slice(0, 5)
                .map((tx: Transaction) => `Hash: ${tx.hash}\nValue: ${tx.value || '0'} ETH\nTimestamp: ${tx.timestamp || 'N/A'}`)
                .join('\n\n');

            callback( {
                text: `Recent transactions for ${address}:\n\n${txSummary}`
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching transactions:', error);
            callback( {
                text: `Failed to fetch transactions: ${error.message}`
            });
        }
    }
};

const modeQueryPlugin: Plugin = {
    name: "@elizaos/plugin-mode-query",
    description: "Plugin for querying Mode network data",
    actions: [getBalance, getLatestBlock, getTransactions],
    evaluators: [],
    providers: [],
    services: []
};

export default modeQueryPlugin;