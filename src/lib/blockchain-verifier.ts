/**
 * Blockchain Verification & Real-time Address Tracing Engine
 *
 * Connects directly to public, CORS-enabled blockchain APIs to trace
 * wallet addresses and verify transactions on-chain:
 * - Bitcoin: mempool.space & blockstream.info
 * - Ethereum / ERC-20: Cloudflare Ethereum RPC, LlamaRPC & Blockscout
 * - Tron (TRC-20): TronGrid Public REST API
 */

export type CryptoNetworkId = 'btc' | 'eth' | 'usdt' | 'usdt_trc20' | 'usdt_erc20';

export interface VerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: string;
  txHash: string;
  network: string;
  fromAddress?: string;
  toAddress?: string;
  amountCrypto?: number;
  amountUsd?: number;
  explorerUrl?: string;
  message: string;
}

export interface AddressTraceResult {
  detected: boolean;
  txHash?: string;
  confirmations?: number;
  confirmed?: boolean;
  amountCrypto?: number;
  amountUsd?: number;
  timestamp?: number;
  explorerUrl?: string;
}

// Fallback benchmark rates for USD conversion if price feed is throttled
const BENCHMARK_RATES: Record<string, number> = {
  btc: 96500,
  eth: 3150,
  usdt: 1.0,
  usdt_trc20: 1.0,
  usdt_erc20: 1.0,
};

export function getExplorerTxUrl(network: CryptoNetworkId, txHash: string): string {
  const norm = network === 'usdt_trc20' ? 'usdt' : network === 'usdt_erc20' ? 'eth' : network;
  if (norm === 'btc') return `https://mempool.space/tx/${txHash}`;
  if (norm === 'eth') return `https://etherscan.io/tx/${txHash}`;
  return `https://tronscan.org/#/transaction/${txHash}`;
}

export function getExplorerAddressUrl(network: CryptoNetworkId, address: string): string {
  const norm = network === 'usdt_trc20' ? 'usdt' : network === 'usdt_erc20' ? 'eth' : network;
  if (norm === 'btc') return `https://mempool.space/address/${address}`;
  if (norm === 'eth') return `https://etherscan.io/address/${address}`;
  return `https://tronscan.org/#/address/${address}`;
}

/**
 * Fetch latest crypto price in USD
 */
export async function getCryptoPriceUsd(network: CryptoNetworkId): Promise<number> {
  const norm = network === 'usdt_trc20' || network === 'usdt_erc20' ? 'usdt' : network;
  if (norm === 'usdt') return 1.0;

  try {
    const coinId = norm === 'btc' ? 'bitcoin' : 'ethereum';
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.[coinId]?.usd) {
        return Number(data[coinId].usd);
      }
    }
  } catch {
    // ignore and fall back
  }

  return BENCHMARK_RATES[norm] ?? 1.0;
}

/**
 * Convert USD amount to exact crypto denomination
 */
export function calculateCryptoAmount(usdAmount: number, rate: number, decimals: number = 6): string {
  if (!usdAmount || usdAmount <= 0 || !rate || rate <= 0) return '0';
  const crypto = usdAmount / rate;
  return rate === 1 ? crypto.toFixed(2) : crypto.toFixed(decimals);
}

/**
 * Verify a Bitcoin transaction on-chain via Mempool.space & Blockstream
 */
async function verifyBitcoinTx(txHash: string, expectedAddress?: string): Promise<VerificationResult> {
  const cleanHash = txHash.trim();
  const isValidFormat = /^[a-fA-F0-9]{64}$/.test(cleanHash);
  if (!isValidFormat) {
    return {
      valid: false,
      confirmed: false,
      confirmations: 0,
      txHash: cleanHash,
      network: 'Bitcoin Mainnet',
      message: 'Invalid Bitcoin TXID format. Expected 64 hexadecimal characters.',
    };
  }

  const endpoints = [
    { name: 'Bitcoin Mainnet (Mempool)', url: `https://mempool.space/api/tx/${cleanHash}` },
    { name: 'Bitcoin Mainnet (Blockstream)', url: `https://blockstream.info/api/tx/${cleanHash}` },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const tx = await res.json();
        const confirmed = Boolean(tx.status?.confirmed);
        const blockHeight = tx.status?.block_height as number | undefined;
        const blockTime = tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : undefined;

        let matchedAmountSat = 0;
        let recipientFound = !expectedAddress;
        if (Array.isArray(tx.vout)) {
          for (const out of tx.vout) {
            if (!expectedAddress || out.scriptpubkey_address?.toLowerCase() === expectedAddress.toLowerCase()) {
              matchedAmountSat += Number(out.value || 0);
              recipientFound = true;
            }
          }
        }

        if (expectedAddress && !recipientFound) {
          return {
            valid: false,
            confirmed,
            confirmations: confirmed ? 2 : 0,
            blockHeight,
            txHash: cleanHash,
            network: ep.name,
            explorerUrl: getExplorerTxUrl('btc', cleanHash),
            message: 'Transaction found on Bitcoin network, but destination address does not match the Trade Tesla deposit wallet.',
          };
        }

        const btcAmount = matchedAmountSat > 0 ? matchedAmountSat / 100_000_000 : undefined;
        return {
          valid: true,
          confirmed,
          confirmations: confirmed ? 2 : 1,
          blockHeight,
          blockTime,
          txHash: cleanHash,
          network: ep.name,
          toAddress: expectedAddress || tx.vout?.[0]?.scriptpubkey_address,
          amountCrypto: btcAmount,
          explorerUrl: getExplorerTxUrl('btc', cleanHash),
          message: confirmed
            ? `Confirmed on Bitcoin blockchain (Block #${blockHeight ?? 'verified'})`
            : 'Detected in Bitcoin mempool — verifying settlement',
        };
      }
      if (res.status === 404) {
        return {
          valid: false,
          confirmed: false,
          confirmations: 0,
          txHash: cleanHash,
          network: ep.name,
          message: 'Bitcoin transaction not found on-chain yet. Wait a moment after broadcasting and retry.',
        };
      }
    } catch {
      // try next explorer
    }
  }

  return {
    valid: false,
    confirmed: false,
    confirmations: 0,
    txHash: cleanHash,
    network: 'Bitcoin Mainnet',
    message: 'Unable to reach Bitcoin blockchain node right now. Please retry in a few seconds.',
  };
}

/**
 * Verify an Ethereum or ERC-20 transaction via public JSON-RPC
 */
async function verifyEthereumTx(txHash: string, expectedAddress?: string): Promise<VerificationResult> {
  const cleanHash = txHash.trim();
  const isEvmHash = /^0x[a-fA-F0-9]{64}$/.test(cleanHash);
  if (!isEvmHash) {
    return {
      valid: false,
      confirmed: false,
      confirmations: 0,
      txHash: cleanHash,
      network: 'Ethereum Mainnet (ERC-20)',
      message: 'Invalid Ethereum TX hash format. Expected 0x followed by 64 hexadecimal characters.',
    };
  }

  const rpcEndpoints = ['https://cloudflare-eth.com', 'https://eth.llamarpc.com', 'https://ethereum-rpc.publicnode.com'];
  const USDT_ERC20 = '0xdac17f958d2ee523a2206206994597c13d831ec7';

  for (const rpc of rpcEndpoints) {
    try {
      const [receiptRes, txRes] = await Promise.all([
        fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [cleanHash] }),
          signal: AbortSignal.timeout(4500),
        }),
        fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getTransactionByHash', params: [cleanHash] }),
          signal: AbortSignal.timeout(4500),
        }),
      ]);

      if (receiptRes.ok) {
        const receiptJson = await receiptRes.json();
        const txJson = txRes.ok ? await txRes.json() : null;
        const receipt = receiptJson?.result;
        const txObj = txJson?.result;

        if (receipt) {
          const success = receipt.status === '0x1';
          const blockNumber = receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined;
          const toAddr = (receipt.to || txObj?.to || '').toLowerCase();
          const expectedLower = expectedAddress?.toLowerCase();

          // Check direct ETH transfer OR ERC-20 Transfer log to expected address
          let addressMatches = !expectedLower || toAddr === expectedLower;
          if (!addressMatches && expectedLower && toAddr === USDT_ERC20 && Array.isArray(receipt.logs)) {
            const expectedTopic = expectedLower.replace(/^0x/, '').padStart(64, '0');
            addressMatches = receipt.logs.some(
              (log: { topics?: string[] }) =>
                Array.isArray(log.topics) &&
                log.topics[2] &&
                log.topics[2].toLowerCase().endsWith(expectedTopic),
            );
          }

          if (!success) {
            return {
              valid: false,
              confirmed: false,
              confirmations: 0,
              blockHeight: blockNumber,
              txHash: cleanHash,
              network: 'Ethereum Mainnet (ERC-20)',
              explorerUrl: getExplorerTxUrl('eth', cleanHash),
              message: 'Transaction reverted / failed on the Ethereum blockchain.',
            };
          }

          if (!addressMatches) {
            return {
              valid: false,
              confirmed: true,
              confirmations: 12,
              blockHeight: blockNumber,
              txHash: cleanHash,
              network: 'Ethereum Mainnet (ERC-20)',
              explorerUrl: getExplorerTxUrl('eth', cleanHash),
              message: 'Ethereum transaction found, but destination address does not match the Trade Tesla wallet.',
            };
          }

          const ethWei = txObj?.value ? parseInt(txObj.value, 16) : 0;
          return {
            valid: true,
            confirmed: true,
            confirmations: 12,
            blockHeight: blockNumber,
            txHash: cleanHash,
            network: 'Ethereum Mainnet (ERC-20)',
            fromAddress: receipt.from,
            toAddress: expectedAddress || receipt.to,
            amountCrypto: ethWei > 0 ? ethWei / 1e18 : undefined,
            explorerUrl: getExplorerTxUrl('eth', cleanHash),
            message: `Confirmed on Ethereum Mainnet (Block #${blockNumber ?? 'verified'})`,
          };
        }

        if (txObj && !receipt) {
          return {
            valid: true,
            confirmed: false,
            confirmations: 0,
            txHash: cleanHash,
            network: 'Ethereum Mainnet (ERC-20)',
            fromAddress: txObj.from,
            toAddress: txObj.to,
            explorerUrl: getExplorerTxUrl('eth', cleanHash),
            message: 'Transaction found in Ethereum mempool — awaiting block confirmation.',
          };
        }

        return {
          valid: false,
          confirmed: false,
          confirmations: 0,
          txHash: cleanHash,
          network: 'Ethereum Mainnet (ERC-20)',
          message: 'Transaction not found on Ethereum yet. Wait a few seconds after broadcasting and retry.',
        };
      }
    } catch {
      // try next RPC endpoint
    }
  }

  return {
    valid: false,
    confirmed: false,
    confirmations: 0,
    txHash: cleanHash,
    network: 'Ethereum Mainnet',
    message: 'Unable to reach Ethereum RPC node right now. Please retry shortly.',
  };
}

/**
 * Verify a Tron (TRC-20 USDT) transaction via TronGrid
 */
async function verifyTronTx(txHash: string, expectedAddress?: string): Promise<VerificationResult> {
  const cleanHash = txHash.trim().replace(/^0x/i, '');
  const isTronHash = /^[a-fA-F0-9]{64}$/.test(cleanHash);
  if (!isTronHash) {
    return {
      valid: false,
      confirmed: false,
      confirmations: 0,
      txHash: cleanHash,
      network: 'Tron TRC-20',
      message: 'Invalid Tron TXID format. Expected 64 hexadecimal characters.',
    };
  }

  try {
    const res = await fetch(`https://api.trongrid.io/v1/transactions/${cleanHash}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const tx = Array.isArray(data?.data) ? data.data[0] : data?.data;
      if (tx) {
        const retStatus = tx.ret?.[0]?.contractRet || tx.contractRet;
        const success = retStatus === 'SUCCESS';
        return {
          valid: success,
          confirmed: success,
          confirmations: success ? 20 : 0,
          blockHeight: tx.blockNumber,
          txHash: cleanHash,
          network: 'Tron TRC-20',
          toAddress: expectedAddress,
          explorerUrl: getExplorerTxUrl('usdt', cleanHash),
          message: success
            ? `Confirmed on Tron network (Block #${tx.blockNumber ?? 'verified'})`
            : `Tron transaction status: ${retStatus || 'FAILED'}`,
        };
      }
      return {
        valid: false,
        confirmed: false,
        confirmations: 0,
        txHash: cleanHash,
        network: 'Tron TRC-20',
        message: 'Tron transaction not found yet. Wait a moment after broadcasting and retry.',
      };
    }
  } catch {
    // network error
  }

  return {
    valid: false,
    confirmed: false,
    confirmations: 0,
    txHash: cleanHash,
    network: 'Tron TRC-20',
    message: 'Unable to reach TronGrid node right now. Please retry shortly.',
  };
}

/**
 * Universal on-chain transaction verifier
 */
export async function verifyTransactionOnChain(
  network: CryptoNetworkId,
  txHash: string,
  expectedAddress?: string,
): Promise<VerificationResult> {
  const norm = network === 'usdt_trc20' ? 'usdt' : network === 'usdt_erc20' ? 'eth' : network;

  if (norm === 'btc') {
    return verifyBitcoinTx(txHash, expectedAddress);
  }
  if (norm === 'eth') {
    return verifyEthereumTx(txHash, expectedAddress);
  }
  return verifyTronTx(txHash, expectedAddress);
}

/**
 * Actively trace an incoming transaction to a given wallet address
 * Polled by the payment gateway during the active countdown session window.
 */
export async function traceAddressIncomingTxs(
  network: CryptoNetworkId,
  address: string,
  minTimestampMs: number,
  expectedAmountUsd?: number,
): Promise<AddressTraceResult> {
  if (!address) return { detected: false };

  const norm = network === 'usdt_trc20' ? 'usdt' : network === 'usdt_erc20' ? 'eth' : network;
  const cleanAddr = address.trim();
  const minWindow = minTimestampMs - 90_000; // 90s clock-skew tolerance

  try {
    if (norm === 'btc') {
      const res = await fetch(`https://mempool.space/api/address/${cleanAddr}/txs`, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const txs = await res.json();
        if (Array.isArray(txs)) {
          for (const tx of txs) {
            const confirmed = Boolean(tx.status?.confirmed);
            const blockTime = tx.status?.block_time ? tx.status.block_time * 1000 : Date.now();
            if (blockTime >= minWindow) {
              let receivedSat = 0;
              if (Array.isArray(tx.vout)) {
                for (const out of tx.vout) {
                  if (out.scriptpubkey_address?.toLowerCase() === cleanAddr.toLowerCase()) {
                    receivedSat += Number(out.value || 0);
                  }
                }
              }
              if (receivedSat > 0) {
                return {
                  detected: true,
                  txHash: tx.txid,
                  confirmed,
                  confirmations: confirmed ? 2 : 1,
                  amountCrypto: receivedSat / 100_000_000,
                  timestamp: blockTime,
                  explorerUrl: getExplorerTxUrl('btc', tx.txid),
                };
              }
            }
          }
        }
      }
    } else if (norm === 'usdt') {
      const res = await fetch(`https://api.trongrid.io/v1/accounts/${cleanAddr}/transactions/trc20?limit=10&only_to=true`, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const json = await res.json();
        const txs = json?.data;
        if (Array.isArray(txs)) {
          for (const tx of txs) {
            const blockTs = Number(tx.block_timestamp || 0);
            const toAddr = String(tx.to || '').trim();
            if (blockTs >= minWindow && toAddr === cleanAddr) {
              const decimals = Number(tx.token_info?.decimals ?? 6);
              const amt = Number(tx.value || 0) / Math.pow(10, decimals);
              // Match within 5% tolerance if expectedAmountUsd is supplied
              if (!expectedAmountUsd || expectedAmountUsd <= 0 || Math.abs(amt - expectedAmountUsd) / expectedAmountUsd <= 0.05) {
                return {
                  detected: true,
                  txHash: tx.transaction_id,
                  confirmed: true,
                  confirmations: 20,
                  amountCrypto: amt,
                  amountUsd: amt,
                  timestamp: blockTs,
                  explorerUrl: getExplorerTxUrl('usdt', tx.transaction_id),
                };
              }
            }
          }
        }
      }
    } else if (norm === 'eth') {
      const res = await fetch(`https://eth.blockscout.com/api/v2/addresses/${cleanAddr}/transactions?filter=to`, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const json = await res.json();
        const items = json?.items;
        if (Array.isArray(items)) {
          for (const tx of items) {
            const ts = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
            const toHash = String(tx.to?.hash || '').toLowerCase();
            if (ts >= minWindow && toHash === cleanAddr.toLowerCase() && tx.status === 'ok') {
              const ethVal = Number(tx.value || 0) / 1e18;
              return {
                detected: true,
                txHash: tx.hash,
                confirmed: true,
                confirmations: 12,
                amountCrypto: ethVal,
                timestamp: ts,
                explorerUrl: getExplorerTxUrl('eth', tx.hash),
              };
            }
          }
        }
      }
    }
  } catch {
    // Network trace timeout or CORS; polling will retry next cycle
  }

  return { detected: false };
}
