import { NitroModules } from 'react-native-nitro-modules'
import {
  create,
  toBinary,
  fromBinary,
  type MessageInitShape,
} from '@bufbuild/protobuf'
import type { Lnd } from './specs/Lnd.nitro'
export type { Subscription } from './specs/Lnd.nitro'

// proto schemas - Lightning
import {
  WalletBalanceRequestSchema,
  WalletBalanceResponseSchema,
  EstimateFeeRequestSchema,
  EstimateFeeResponseSchema,
  NewAddressRequestSchema,
  NewAddressResponseSchema,
  GetInfoResponseSchema,
  GetRecoveryInfoResponseSchema,
  StopResponseSchema,
  GetTransactionsRequestSchema,
  TransactionDetailsSchema,
  SendCoinsRequestSchema,
  SendCoinsResponseSchema,
  TransactionSchema,
  type Transaction,
} from './proto/lightning_pb'

// proto schemas - WalletUnlocker
import {
  GenSeedRequestSchema,
  GenSeedResponseSchema,
  InitWalletRequestSchema,
  InitWalletResponseSchema,
  UnlockWalletRequestSchema,
  UnlockWalletResponseSchema,
} from './proto/walletunlocker_pb'

// proto schemas - StateService
import {
  SubscribeStateResponseSchema,
  type SubscribeStateResponse,
} from './proto/stateservice_pb'

// proto schemas - WalletKit
import {
  ImportAccountRequestSchema,
  ImportAccountResponseSchema,
  ListAccountsRequestSchema,
  ListAccountsResponseSchema,
  ListAddressesRequestSchema,
  ListAddressesResponseSchema,
  ListLeasesRequestSchema,
  ListLeasesResponseSchema,
  ListUnspentRequestSchema as WalletKitListUnspentRequestSchema,
  ListUnspentResponseSchema as WalletKitListUnspentResponseSchema,
  LabelTransactionRequestSchema,
  LabelTransactionResponseSchema,
  ReleaseOutputRequestSchema,
  ReleaseOutputResponseSchema,
  TransactionSchema as WalletKitTransactionSchema,
  PublishResponseSchema,
  SignMessageWithAddrRequestSchema,
  SignMessageWithAddrResponseSchema,
  VerifyMessageWithAddrRequestSchema,
  VerifyMessageWithAddrResponseSchema,
  SignPsbtRequestSchema,
  SignPsbtResponseSchema,
  FundPsbtRequestSchema,
  FundPsbtResponseSchema,
  FinalizePsbtRequestSchema,
  FinalizePsbtResponseSchema,
  ImportMwebScanKeyRequestSchema,
  ImportMwebScanKeyResponseSchema,
} from './proto/walletrpc/walletkit_pb'

// proto schemas - NeutrinoKit
import { StatusResponseSchema as NeutrinoStatusResponseSchema } from './proto/neutrinorpc/neutrino_pb'

// re-export proto types for consumers
export type {
  WalletBalanceRequest,
  WalletBalanceResponse,
  EstimateFeeRequest,
  EstimateFeeResponse,
  NewAddressRequest,
  NewAddressResponse,
  GetInfoRequest,
  GetInfoResponse,
  GetRecoveryInfoRequest,
  GetRecoveryInfoResponse,
  StopRequest,
  StopResponse,
  GetTransactionsRequest,
  TransactionDetails,
  SendCoinsRequest,
  SendCoinsResponse,
  Transaction,
  Utxo,
  OutPoint,
  PreviousOutPoint,
} from './proto/lightning_pb'

export { AddressType, OutputScriptType } from './proto/lightning_pb'

export type {
  GenSeedRequest,
  GenSeedResponse,
  InitWalletRequest,
  InitWalletResponse,
  UnlockWalletRequest,
  UnlockWalletResponse,
} from './proto/walletunlocker_pb'

export type {
  SubscribeStateRequest,
  SubscribeStateResponse,
} from './proto/stateservice_pb'

export { WalletState } from './proto/stateservice_pb'

export type {
  ImportAccountRequest,
  ImportAccountResponse,
  ListAccountsRequest,
  ListAccountsResponse,
  ListAddressesRequest,
  ListAddressesResponse,
  ListLeasesRequest,
  ListLeasesResponse,
  LabelTransactionRequest,
  LabelTransactionResponse,
  ReleaseOutputRequest,
  ReleaseOutputResponse,
  PublishResponse,
  SignMessageWithAddrRequest,
  SignMessageWithAddrResponse,
  VerifyMessageWithAddrRequest,
  VerifyMessageWithAddrResponse,
  SignPsbtRequest,
  SignPsbtResponse,
  FundPsbtRequest,
  FundPsbtResponse,
  FinalizePsbtRequest,
  FinalizePsbtResponse,
  ImportMwebScanKeyRequest,
  ImportMwebScanKeyResponse,
} from './proto/walletrpc/walletkit_pb'

export {
  AddressType as WalletKitAddressType,
  ChangeAddressType,
} from './proto/walletrpc/walletkit_pb'

export type {
  StatusRequest as NeutrinoStatusRequest,
  StatusResponse as NeutrinoStatusResponse,
} from './proto/neutrinorpc/neutrino_pb'

// lazy init to avoid initialization-order issues
let _lnd: Lnd | null = null
function getLnd(): Lnd {
  if (_lnd == null) {
    _lnd = NitroModules.createHybridObject<Lnd>('Lnd')
  }
  return _lnd
}

// ArrayBuffer helper with fast path
function toArrayBuffer(uint8: Uint8Array): ArrayBuffer {
  const buf = uint8.buffer as ArrayBuffer
  if (uint8.byteOffset === 0 && uint8.byteLength === buf.byteLength) {
    return buf
  }
  return buf.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength)
}

const EMPTY_BUFFER = new ArrayBuffer(0)

// daemon lifecycle

export function start(args: string): Promise<void> {
  return getLnd().start(args)
}

// WalletUnlocker subserver

export async function genSeed(
  request: MessageInitShape<typeof GenSeedRequestSchema> = {}
) {
  const bytes = toBinary(
    GenSeedRequestSchema,
    create(GenSeedRequestSchema, request)
  )
  const response = await getLnd().genSeed(toArrayBuffer(bytes))
  return fromBinary(GenSeedResponseSchema, new Uint8Array(response))
}

export async function initWallet(
  request: MessageInitShape<typeof InitWalletRequestSchema>
) {
  const bytes = toBinary(
    InitWalletRequestSchema,
    create(InitWalletRequestSchema, request)
  )
  const response = await getLnd().initWallet(toArrayBuffer(bytes))
  return fromBinary(InitWalletResponseSchema, new Uint8Array(response))
}

export async function unlockWallet(
  request: MessageInitShape<typeof UnlockWalletRequestSchema>
) {
  const bytes = toBinary(
    UnlockWalletRequestSchema,
    create(UnlockWalletRequestSchema, request)
  )
  const response = await getLnd().unlockWallet(toArrayBuffer(bytes))
  return fromBinary(UnlockWalletResponseSchema, new Uint8Array(response))
}

// Lightning subserver

export async function walletBalance(
  request: MessageInitShape<typeof WalletBalanceRequestSchema> = {}
) {
  const bytes = toBinary(
    WalletBalanceRequestSchema,
    create(WalletBalanceRequestSchema, request)
  )
  const response = await getLnd().walletBalance(toArrayBuffer(bytes))
  return fromBinary(WalletBalanceResponseSchema, new Uint8Array(response))
}

export async function estimateFee(
  request: MessageInitShape<typeof EstimateFeeRequestSchema>
) {
  const bytes = toBinary(
    EstimateFeeRequestSchema,
    create(EstimateFeeRequestSchema, request)
  )
  const response = await getLnd().estimateFee(toArrayBuffer(bytes))
  return fromBinary(EstimateFeeResponseSchema, new Uint8Array(response))
}

export async function newAddress(
  request: MessageInitShape<typeof NewAddressRequestSchema>
) {
  const bytes = toBinary(
    NewAddressRequestSchema,
    create(NewAddressRequestSchema, request)
  )
  const response = await getLnd().newAddress(toArrayBuffer(bytes))
  return fromBinary(NewAddressResponseSchema, new Uint8Array(response))
}

export async function getInfo() {
  const response = await getLnd().getInfo(EMPTY_BUFFER)
  return fromBinary(GetInfoResponseSchema, new Uint8Array(response))
}

export async function getRecoveryInfo() {
  const response = await getLnd().getRecoveryInfo(EMPTY_BUFFER)
  return fromBinary(GetRecoveryInfoResponseSchema, new Uint8Array(response))
}

export async function stopDaemon() {
  const response = await getLnd().stopDaemon(EMPTY_BUFFER)
  return fromBinary(StopResponseSchema, new Uint8Array(response))
}

export async function getTransactions(
  request: MessageInitShape<typeof GetTransactionsRequestSchema> = {}
) {
  const bytes = toBinary(
    GetTransactionsRequestSchema,
    create(GetTransactionsRequestSchema, request)
  )
  const response = await getLnd().getTransactions(toArrayBuffer(bytes))
  return fromBinary(TransactionDetailsSchema, new Uint8Array(response))
}

export async function sendCoins(
  request: MessageInitShape<typeof SendCoinsRequestSchema>
) {
  const bytes = toBinary(
    SendCoinsRequestSchema,
    create(SendCoinsRequestSchema, request)
  )
  const response = await getLnd().sendCoins(toArrayBuffer(bytes))
  return fromBinary(SendCoinsResponseSchema, new Uint8Array(response))
}

// WalletKit subserver

export async function walletKitImportAccount(
  request: MessageInitShape<typeof ImportAccountRequestSchema>
) {
  const bytes = toBinary(
    ImportAccountRequestSchema,
    create(ImportAccountRequestSchema, request)
  )
  const response = await getLnd().walletKitImportAccount(toArrayBuffer(bytes))
  return fromBinary(ImportAccountResponseSchema, new Uint8Array(response))
}

export async function walletKitListAccounts(
  request: MessageInitShape<typeof ListAccountsRequestSchema> = {}
) {
  const bytes = toBinary(
    ListAccountsRequestSchema,
    create(ListAccountsRequestSchema, request)
  )
  const response = await getLnd().walletKitListAccounts(toArrayBuffer(bytes))
  return fromBinary(ListAccountsResponseSchema, new Uint8Array(response))
}

export async function walletKitListAddresses(
  request: MessageInitShape<typeof ListAddressesRequestSchema> = {}
) {
  const bytes = toBinary(
    ListAddressesRequestSchema,
    create(ListAddressesRequestSchema, request)
  )
  const response = await getLnd().walletKitListAddresses(toArrayBuffer(bytes))
  return fromBinary(ListAddressesResponseSchema, new Uint8Array(response))
}

export async function walletKitListLeases(
  request: MessageInitShape<typeof ListLeasesRequestSchema> = {}
) {
  const bytes = toBinary(
    ListLeasesRequestSchema,
    create(ListLeasesRequestSchema, request)
  )
  const response = await getLnd().walletKitListLeases(toArrayBuffer(bytes))
  return fromBinary(ListLeasesResponseSchema, new Uint8Array(response))
}

export async function walletKitListUnspent(
  request: MessageInitShape<typeof WalletKitListUnspentRequestSchema> = {}
) {
  const bytes = toBinary(
    WalletKitListUnspentRequestSchema,
    create(WalletKitListUnspentRequestSchema, request)
  )
  const response = await getLnd().walletKitListUnspent(toArrayBuffer(bytes))
  return fromBinary(
    WalletKitListUnspentResponseSchema,
    new Uint8Array(response)
  )
}

export async function walletKitLabelTransaction(
  request: MessageInitShape<typeof LabelTransactionRequestSchema>
) {
  const bytes = toBinary(
    LabelTransactionRequestSchema,
    create(LabelTransactionRequestSchema, request)
  )
  const response = await getLnd().walletKitLabelTransaction(
    toArrayBuffer(bytes)
  )
  return fromBinary(LabelTransactionResponseSchema, new Uint8Array(response))
}

export async function walletKitReleaseOutput(
  request: MessageInitShape<typeof ReleaseOutputRequestSchema>
) {
  const bytes = toBinary(
    ReleaseOutputRequestSchema,
    create(ReleaseOutputRequestSchema, request)
  )
  const response = await getLnd().walletKitReleaseOutput(toArrayBuffer(bytes))
  return fromBinary(ReleaseOutputResponseSchema, new Uint8Array(response))
}

export async function walletKitPublishTransaction(
  request: MessageInitShape<typeof WalletKitTransactionSchema>
) {
  const bytes = toBinary(
    WalletKitTransactionSchema,
    create(WalletKitTransactionSchema, request)
  )
  const response = await getLnd().walletKitPublishTransaction(
    toArrayBuffer(bytes)
  )
  return fromBinary(PublishResponseSchema, new Uint8Array(response))
}

export async function walletKitSignMessageWithAddr(
  request: MessageInitShape<typeof SignMessageWithAddrRequestSchema>
) {
  const bytes = toBinary(
    SignMessageWithAddrRequestSchema,
    create(SignMessageWithAddrRequestSchema, request)
  )
  const response = await getLnd().walletKitSignMessageWithAddr(
    toArrayBuffer(bytes)
  )
  return fromBinary(SignMessageWithAddrResponseSchema, new Uint8Array(response))
}

export async function walletKitVerifyMessageWithAddr(
  request: MessageInitShape<typeof VerifyMessageWithAddrRequestSchema>
) {
  const bytes = toBinary(
    VerifyMessageWithAddrRequestSchema,
    create(VerifyMessageWithAddrRequestSchema, request)
  )
  const response = await getLnd().walletKitVerifyMessageWithAddr(
    toArrayBuffer(bytes)
  )
  return fromBinary(
    VerifyMessageWithAddrResponseSchema,
    new Uint8Array(response)
  )
}

export async function walletKitSignPsbt(
  request: MessageInitShape<typeof SignPsbtRequestSchema>
) {
  const bytes = toBinary(
    SignPsbtRequestSchema,
    create(SignPsbtRequestSchema, request)
  )
  const response = await getLnd().walletKitSignPsbt(toArrayBuffer(bytes))
  return fromBinary(SignPsbtResponseSchema, new Uint8Array(response))
}

export async function walletKitFundPsbt(
  request: MessageInitShape<typeof FundPsbtRequestSchema>
) {
  const bytes = toBinary(
    FundPsbtRequestSchema,
    create(FundPsbtRequestSchema, request)
  )
  const response = await getLnd().walletKitFundPsbt(toArrayBuffer(bytes))
  return fromBinary(FundPsbtResponseSchema, new Uint8Array(response))
}

export async function walletKitFinalizePsbt(
  request: MessageInitShape<typeof FinalizePsbtRequestSchema>
) {
  const bytes = toBinary(
    FinalizePsbtRequestSchema,
    create(FinalizePsbtRequestSchema, request)
  )
  const response = await getLnd().walletKitFinalizePsbt(toArrayBuffer(bytes))
  return fromBinary(FinalizePsbtResponseSchema, new Uint8Array(response))
}

export async function walletKitImportMwebScanKey(
  request: MessageInitShape<typeof ImportMwebScanKeyRequestSchema>
) {
  const bytes = toBinary(
    ImportMwebScanKeyRequestSchema,
    create(ImportMwebScanKeyRequestSchema, request)
  )
  const response = await getLnd().walletKitImportMwebScanKey(
    toArrayBuffer(bytes)
  )
  return fromBinary(ImportMwebScanKeyResponseSchema, new Uint8Array(response))
}

// NeutrinoKit subserver

export async function neutrinoKitStatus() {
  const response = await getLnd().neutrinoKitStatus(EMPTY_BUFFER)
  return fromBinary(NeutrinoStatusResponseSchema, new Uint8Array(response))
}

// streaming rpcs

export function subscribeState(
  onStateChange: (response: SubscribeStateResponse) => void,
  onError: (error: string) => void
) {
  return getLnd().subscribeState(
    EMPTY_BUFFER,
    (buf: ArrayBuffer) => {
      onStateChange(
        fromBinary(SubscribeStateResponseSchema, new Uint8Array(buf))
      )
    },
    onError
  )
}

export function subscribeTransactions(
  request: MessageInitShape<typeof GetTransactionsRequestSchema>,
  onTransaction: (tx: Transaction) => void,
  onError: (error: string) => void
) {
  const bytes = toBinary(
    GetTransactionsRequestSchema,
    create(GetTransactionsRequestSchema, request)
  )
  return getLnd().subscribeTransactions(
    toArrayBuffer(bytes),
    (buf: ArrayBuffer) => {
      onTransaction(fromBinary(TransactionSchema, new Uint8Array(buf)))
    },
    onError
  )
}
