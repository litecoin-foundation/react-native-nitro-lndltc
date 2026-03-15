import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Represents an active subscription to a server-streaming RPC.
 * Call cancel() to stop receiving callbacks. Also cleans up
 * automatically when garbage collected.
 */
export interface Subscription extends HybridObject<{
  ios: 'c++'
  android: 'c++'
}> {
  cancel(): void
}

/**
 * NitroModule interface for interacting with lndltc's RPC.
 * All unary RPCs accept/return protobuf-encoded ArrayBuffers.
 * Server-streaming RPCs use callbacks and return a Subscription.
 */
export interface Lnd extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // daemon lifecycle - takes plain string args
  start(args: string): Promise<void>

  // WalletUnlocker subserver
  initWallet(data: ArrayBuffer): Promise<ArrayBuffer>
  unlockWallet(data: ArrayBuffer): Promise<ArrayBuffer>

  // Lightning subserver
  walletBalance(data: ArrayBuffer): Promise<ArrayBuffer>
  estimateFee(data: ArrayBuffer): Promise<ArrayBuffer>
  newAddress(data: ArrayBuffer): Promise<ArrayBuffer>
  getInfo(data: ArrayBuffer): Promise<ArrayBuffer>
  getRecoveryInfo(data: ArrayBuffer): Promise<ArrayBuffer>
  stopDaemon(data: ArrayBuffer): Promise<ArrayBuffer>
  getTransactions(data: ArrayBuffer): Promise<ArrayBuffer>
  sendCoins(data: ArrayBuffer): Promise<ArrayBuffer>

  // WalletKit subserver
  walletKitLabelTransaction(data: ArrayBuffer): Promise<ArrayBuffer>
  walletKitListUnspent(data: ArrayBuffer): Promise<ArrayBuffer>
  walletKitFundPsbt(data: ArrayBuffer): Promise<ArrayBuffer>
  walletKitFinalizePsbt(data: ArrayBuffer): Promise<ArrayBuffer>
  walletKitImportMwebScanKey(data: ArrayBuffer): Promise<ArrayBuffer>

  // NeutrinoKit subserver
  neutrinoKitStatus(data: ArrayBuffer): Promise<ArrayBuffer>

  // streaming rpcs
  subscribeState(
    data: ArrayBuffer,
    onResponse: (data: ArrayBuffer) => void,
    onError: (error: string) => void
  ): Subscription

  subscribeTransactions(
    data: ArrayBuffer,
    onResponse: (data: ArrayBuffer) => void,
    onError: (error: string) => void
  ): Subscription
}
