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

// Decode the envelope ArrayBuffer from C++.
// Byte 0 = 0x00: success (rest is protobuf). Byte 0 = 0x01: error (rest is UTF-8 message).
// This bypasses NitroModules' broken exception_ptr RTTI matching entirely.
const textDecoder = new TextDecoder()

function unwrapEnvelope(envelope: ArrayBuffer): Uint8Array {
  const view = new Uint8Array(envelope)
  if (view.length === 0) {
    throw new Error('empty response from native')
  }
  if (view[0] === 0x01) {
    const errorMsg = textDecoder.decode(view.subarray(1))
    throw new Error(errorMsg)
  }
  return view.subarray(1)
}

// daemon lifecycle

export async function start(args: string): Promise<void> {
  const envelope = await getLnd().start(args)
  unwrapEnvelope(envelope) // throws if error, discards empty success payload
}

// WalletUnlocker subserver

export async function genSeed(
  request: MessageInitShape<typeof GenSeedRequestSchema> = {}
) {
  const bytes = toBinary(GenSeedRequestSchema, create(GenSeedRequestSchema, request))
  const envelope = await getLnd().genSeed(toArrayBuffer(bytes))
  return fromBinary(GenSeedResponseSchema, unwrapEnvelope(envelope))
}

export async function initWallet(
  request: MessageInitShape<typeof InitWalletRequestSchema>
) {
  const bytes = toBinary(InitWalletRequestSchema, create(InitWalletRequestSchema, request))
  const envelope = await getLnd().initWallet(toArrayBuffer(bytes))
  return fromBinary(InitWalletResponseSchema, unwrapEnvelope(envelope))
}

export async function unlockWallet(
  request: MessageInitShape<typeof UnlockWalletRequestSchema>
) {
  const bytes = toBinary(UnlockWalletRequestSchema, create(UnlockWalletRequestSchema, request))
  const envelope = await getLnd().unlockWallet(toArrayBuffer(bytes))
  return fromBinary(UnlockWalletResponseSchema, unwrapEnvelope(envelope))
}

// Lightning subserver

export async function walletBalance(request: MessageInitShape<typeof WalletBalanceRequestSchema> = {}) {
  const bytes = toBinary(WalletBalanceRequestSchema, create(WalletBalanceRequestSchema, request))
  return fromBinary(WalletBalanceResponseSchema, unwrapEnvelope(await getLnd().walletBalance(toArrayBuffer(bytes))))
}

export async function estimateFee(request: MessageInitShape<typeof EstimateFeeRequestSchema>) {
  const bytes = toBinary(EstimateFeeRequestSchema, create(EstimateFeeRequestSchema, request))
  return fromBinary(EstimateFeeResponseSchema, unwrapEnvelope(await getLnd().estimateFee(toArrayBuffer(bytes))))
}

export async function newAddress(request: MessageInitShape<typeof NewAddressRequestSchema>) {
  const bytes = toBinary(NewAddressRequestSchema, create(NewAddressRequestSchema, request))
  return fromBinary(NewAddressResponseSchema, unwrapEnvelope(await getLnd().newAddress(toArrayBuffer(bytes))))
}

export async function getInfo() {
  return fromBinary(GetInfoResponseSchema, unwrapEnvelope(await getLnd().getInfo(EMPTY_BUFFER)))
}

export async function getRecoveryInfo() {
  return fromBinary(GetRecoveryInfoResponseSchema, unwrapEnvelope(await getLnd().getRecoveryInfo(EMPTY_BUFFER)))
}

export async function stopDaemon() {
  return fromBinary(StopResponseSchema, unwrapEnvelope(await getLnd().stopDaemon(EMPTY_BUFFER)))
}

export async function getTransactions(request: MessageInitShape<typeof GetTransactionsRequestSchema> = {}) {
  const bytes = toBinary(GetTransactionsRequestSchema, create(GetTransactionsRequestSchema, request))
  return fromBinary(TransactionDetailsSchema, unwrapEnvelope(await getLnd().getTransactions(toArrayBuffer(bytes))))
}

export async function sendCoins(request: MessageInitShape<typeof SendCoinsRequestSchema>) {
  const bytes = toBinary(SendCoinsRequestSchema, create(SendCoinsRequestSchema, request))
  return fromBinary(SendCoinsResponseSchema, unwrapEnvelope(await getLnd().sendCoins(toArrayBuffer(bytes))))
}

// WalletKit subserver

export async function walletKitImportAccount(request: MessageInitShape<typeof ImportAccountRequestSchema>) {
  const bytes = toBinary(ImportAccountRequestSchema, create(ImportAccountRequestSchema, request))
  return fromBinary(ImportAccountResponseSchema, unwrapEnvelope(await getLnd().walletKitImportAccount(toArrayBuffer(bytes))))
}

export async function walletKitListAccounts(request: MessageInitShape<typeof ListAccountsRequestSchema> = {}) {
  const bytes = toBinary(ListAccountsRequestSchema, create(ListAccountsRequestSchema, request))
  return fromBinary(ListAccountsResponseSchema, unwrapEnvelope(await getLnd().walletKitListAccounts(toArrayBuffer(bytes))))
}

export async function walletKitListAddresses(request: MessageInitShape<typeof ListAddressesRequestSchema> = {}) {
  const bytes = toBinary(ListAddressesRequestSchema, create(ListAddressesRequestSchema, request))
  return fromBinary(ListAddressesResponseSchema, unwrapEnvelope(await getLnd().walletKitListAddresses(toArrayBuffer(bytes))))
}

export async function walletKitListLeases(request: MessageInitShape<typeof ListLeasesRequestSchema> = {}) {
  const bytes = toBinary(ListLeasesRequestSchema, create(ListLeasesRequestSchema, request))
  return fromBinary(ListLeasesResponseSchema, unwrapEnvelope(await getLnd().walletKitListLeases(toArrayBuffer(bytes))))
}

export async function walletKitListUnspent(request: MessageInitShape<typeof WalletKitListUnspentRequestSchema> = {}) {
  const bytes = toBinary(WalletKitListUnspentRequestSchema, create(WalletKitListUnspentRequestSchema, request))
  return fromBinary(WalletKitListUnspentResponseSchema, unwrapEnvelope(await getLnd().walletKitListUnspent(toArrayBuffer(bytes))))
}

export async function walletKitLabelTransaction(request: MessageInitShape<typeof LabelTransactionRequestSchema>) {
  const bytes = toBinary(LabelTransactionRequestSchema, create(LabelTransactionRequestSchema, request))
  return fromBinary(LabelTransactionResponseSchema, unwrapEnvelope(await getLnd().walletKitLabelTransaction(toArrayBuffer(bytes))))
}

export async function walletKitReleaseOutput(request: MessageInitShape<typeof ReleaseOutputRequestSchema>) {
  const bytes = toBinary(ReleaseOutputRequestSchema, create(ReleaseOutputRequestSchema, request))
  return fromBinary(ReleaseOutputResponseSchema, unwrapEnvelope(await getLnd().walletKitReleaseOutput(toArrayBuffer(bytes))))
}

export async function walletKitPublishTransaction(request: MessageInitShape<typeof WalletKitTransactionSchema>) {
  const bytes = toBinary(WalletKitTransactionSchema, create(WalletKitTransactionSchema, request))
  return fromBinary(PublishResponseSchema, unwrapEnvelope(await getLnd().walletKitPublishTransaction(toArrayBuffer(bytes))))
}

export async function walletKitSignMessageWithAddr(request: MessageInitShape<typeof SignMessageWithAddrRequestSchema>) {
  const bytes = toBinary(SignMessageWithAddrRequestSchema, create(SignMessageWithAddrRequestSchema, request))
  return fromBinary(SignMessageWithAddrResponseSchema, unwrapEnvelope(await getLnd().walletKitSignMessageWithAddr(toArrayBuffer(bytes))))
}

export async function walletKitVerifyMessageWithAddr(request: MessageInitShape<typeof VerifyMessageWithAddrRequestSchema>) {
  const bytes = toBinary(VerifyMessageWithAddrRequestSchema, create(VerifyMessageWithAddrRequestSchema, request))
  return fromBinary(VerifyMessageWithAddrResponseSchema, unwrapEnvelope(await getLnd().walletKitVerifyMessageWithAddr(toArrayBuffer(bytes))))
}

export async function walletKitSignPsbt(request: MessageInitShape<typeof SignPsbtRequestSchema>) {
  const bytes = toBinary(SignPsbtRequestSchema, create(SignPsbtRequestSchema, request))
  return fromBinary(SignPsbtResponseSchema, unwrapEnvelope(await getLnd().walletKitSignPsbt(toArrayBuffer(bytes))))
}

export async function walletKitFundPsbt(request: MessageInitShape<typeof FundPsbtRequestSchema>) {
  const bytes = toBinary(FundPsbtRequestSchema, create(FundPsbtRequestSchema, request))
  return fromBinary(FundPsbtResponseSchema, unwrapEnvelope(await getLnd().walletKitFundPsbt(toArrayBuffer(bytes))))
}

export async function walletKitFinalizePsbt(request: MessageInitShape<typeof FinalizePsbtRequestSchema>) {
  const bytes = toBinary(FinalizePsbtRequestSchema, create(FinalizePsbtRequestSchema, request))
  return fromBinary(FinalizePsbtResponseSchema, unwrapEnvelope(await getLnd().walletKitFinalizePsbt(toArrayBuffer(bytes))))
}

export async function walletKitImportMwebScanKey(request: MessageInitShape<typeof ImportMwebScanKeyRequestSchema>) {
  const bytes = toBinary(ImportMwebScanKeyRequestSchema, create(ImportMwebScanKeyRequestSchema, request))
  return fromBinary(ImportMwebScanKeyResponseSchema, unwrapEnvelope(await getLnd().walletKitImportMwebScanKey(toArrayBuffer(bytes))))
}

// NeutrinoKit subserver

export async function neutrinoKitStatus() {
  return fromBinary(NeutrinoStatusResponseSchema, unwrapEnvelope(await getLnd().neutrinoKitStatus(EMPTY_BUFFER)))
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
