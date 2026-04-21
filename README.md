# react-native-nitro-lndltc

A high-performance React Native library for interacting with [lndltc](https://github.com/ltcsuite/lnd) (Litecoin Lightning Network Daemon), built with [NitroModules](https://nitro.margelo.com/) and C++.

## Features

- Direct `ArrayBuffer` bridge
- Protobuf-es for type-safe request/response serialization
- Server-streaming subscriptions with cancellation support
- React Native new architecture only

## Installation

```bash
bun add react-native-nitro-lndltc react-native-nitro-modules
```

### liblnd binary

This library does **not** bundle the lndltc binary. You must provide `liblnd` yourself.
Prebuilt binaries are available at: **https://static.nexuswallet.com/lndmobile/**

#### iOS

1. Download and place `liblnd.a` in your React Native project's `ios/` folder.
2. Add `liblnd.a` to **Build Phases** -> **Link Binary With Libraries**
3. Also add `libresolv.tbd` to linked libraries
4. Run `bun run pods`

#### Android

Place `liblnd.so` for each architecture in your app's `jniLibs`:

```
android/app/src/main/jniLibs/
  arm64-v8a/liblnd.so
  armeabi-v7a/liblnd.so
  x86/liblnd.so
  x86_64/liblnd.so
```

## Usage

### Start the daemon

```typescript
import { start, subscribeState, WalletState } from 'react-native-nitro-lndltc'

// Write lnd.conf to your app's documents directory first, then:
const subscription = subscribeState(
  (response) => {
    console.log('State:', WalletState[response.state])
  },
  (error) => console.error(error)
)

await start(`--lnddir=${lndDir}`)
```

### Create or unlock a wallet

```typescript
import { genSeed, initWallet, unlockWallet } from 'react-native-nitro-lndltc'

// First run: generate seed and create wallet
const seed = await genSeed({})
const { adminMacaroon } = await initWallet({
  walletPassword: new TextEncoder().encode('mypassword'),
  cipherSeedMnemonic: seed.cipherSeedMnemonic,
})

// Subsequent runs: unlock
await unlockWallet({
  walletPassword: new TextEncoder().encode('mypassword'),
})
```

### Query wallet info

```typescript
import {
  getInfo,
  walletBalance,
  newAddress,
  AddressType,
} from 'react-native-nitro-lndltc'

const info = await getInfo()
console.log(info.version, info.blockHeight, info.syncedToChain)

const balance = await walletBalance({})
console.log('Balance:', balance.confirmedBalance, 'sat')

const { address } = await newAddress({ type: AddressType.WITNESS_PUBKEY_HASH })
console.log('Address:', address)
```

### Send coins

```typescript
import { sendCoins } from 'react-native-nitro-lndltc'

const { txid } = await sendCoins({
  addr: 'ltc1q...',
  amount: BigInt(100000),
  targetConf: 6,
})
```

### Subscribe to transactions

```typescript
import { subscribeTransactions } from 'react-native-nitro-lndltc'

const subscription = subscribeTransactions(
  {},
  (tx) => {
    console.log('New tx:', tx.txHash, tx.amount, 'sat')
  },
  (error) => console.error(error)
)

// Later: stop receiving updates
subscription.cancel()
```

### Other methods

```typescript
import {
  estimateFee,
  getTransactions,
  getRecoveryInfo,
  stopDaemon,
  neutrinoKitStatus,
  walletKitListUnspent,
  walletKitLabelTransaction,
  walletKitFundPsbt,
  walletKitFinalizePsbt,
  walletKitImportMwebScanKey,
  walletKitPrepareMwebPresign,
} from 'react-native-nitro-lndltc'
```

## API

### Daemon lifecycle

| Function | Description |
|----------|-------------|
| `start(args)` | Start the lnd daemon with CLI flags |
| `stopDaemon()` | Stop the daemon |
| `subscribeState(onState, onError)` | Subscribe to wallet state changes. Returns `Subscription` |

### Wallet management

| Function | Description |
|----------|-------------|
| `genSeed(request?)` | Generate a new wallet seed |
| `initWallet(request)` | Create a new wallet with password and seed |
| `unlockWallet(request)` | Unlock an existing wallet |
| `walletBalance(request?)` | Get wallet balance (total, confirmed, unconfirmed) |
| `newAddress(request)` | Generate a new address (P2WPKH, P2SH-P2WPKH, MWEB) |

### Transactions

| Function | Description |
|----------|-------------|
| `getTransactions(request?)` | Get transaction history |
| `sendCoins(request)` | Send coins to an address |
| `estimateFee(request)` | Estimate transaction fee |
| `subscribeTransactions(request, onTx, onError)` | Live transaction updates. Returns `Subscription` |

### Node info

| Function | Description |
|----------|-------------|
| `getInfo()` | Get node info (version, pubkey, sync status, etc.) |
| `getRecoveryInfo()` | Get wallet recovery progress |
| `neutrinoKitStatus()` | Get neutrino light client sync status |

### WalletKit

| Function | Description |
|----------|-------------|
| `walletKitImportAccount(request)` | Import a watch-only account |
| `walletKitListAccounts(request?)` | List wallet accounts |
| `walletKitListAddresses(request?)` | List addresses for all accounts |
| `walletKitListLeases(request?)` | List currently locked UTXOs |
| `walletKitListUnspent(request?)` | List unspent outputs |
| `walletKitLabelTransaction(request)` | Label a transaction |
| `walletKitReleaseOutput(request)` | Release a previously locked UTXO |
| `walletKitPublishTransaction(request)` | Publish a raw transaction to the network |
| `walletKitSignMessageWithAddr(request)` | Sign a message with an address's private key |
| `walletKitVerifyMessageWithAddr(request)` | Verify a signed message against an address |
| `walletKitSignPsbt(request)` | Sign a PSBT with wallet keys |
| `walletKitFundPsbt(request)` | Create and fund a PSBT |
| `walletKitFinalizePsbt(request)` | Finalize a PSBT into a broadcast-ready transaction |
| `walletKitImportMwebScanKey(request)` | Import an MWEB scan key for HW wallet integration |
| `walletKitPrepareMwebPresign(request)` | Attach MWEB presign fields (sender key + stealth scalar) to a funded PSBT for an external signer |

### Types

```typescript
// Enums
import { AddressType, WalletState, OutputScriptType, ChangeAddressType } from 'react-native-nitro-lndltc'

// Subscription handle (returned by subscribe methods)
import type { Subscription } from 'react-native-nitro-lndltc'
```

## Example app

See the [example/](example/) directory for a working app with daemon management, wallet creation, balance display, address generation, and live transaction streaming.
