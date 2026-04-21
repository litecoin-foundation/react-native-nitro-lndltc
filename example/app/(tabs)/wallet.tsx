import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {
  walletBalance,
  newAddress,
  getTransactions,
  subscribeTransactions,
  walletKitPrepareMwebPresign,
  AddressType,
  type Subscription,
} from 'react-native-nitro-lndltc'

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/, '').replace(/\s+/g, '')
  if (clean.length % 2 !== 0) {
    throw new Error('hex must have an even number of characters')
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) throw new Error('invalid hex')
    out[i] = byte
  }
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0')
  }
  return s
}

const B64_ALPHA =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1] ?? 0
    const b2 = bytes[i + 2] ?? 0
    const chunk = (b0 << 16) | (b1 << 8) | b2
    s += B64_ALPHA[(chunk >> 18) & 0x3f]
    s += B64_ALPHA[(chunk >> 12) & 0x3f]
    s += i + 1 < bytes.length ? B64_ALPHA[(chunk >> 6) & 0x3f] : '='
    s += i + 2 < bytes.length ? B64_ALPHA[chunk & 0x3f] : '='
  }
  return s
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.trim().replace(/\s+/g, '')
  if (clean.length % 4 !== 0) throw new Error('invalid base64 length')
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
  const out = new Uint8Array((clean.length / 4) * 3 - pad)
  let j = 0
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_ALPHA.indexOf(clean[i])
    const c1 = B64_ALPHA.indexOf(clean[i + 1])
    const c2 = clean[i + 2] === '=' ? 0 : B64_ALPHA.indexOf(clean[i + 2])
    const c3 = clean[i + 3] === '=' ? 0 : B64_ALPHA.indexOf(clean[i + 3])
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) {
      throw new Error('invalid base64 character')
    }
    const chunk = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3
    if (j < out.length) out[j++] = (chunk >> 16) & 0xff
    if (j < out.length) out[j++] = (chunk >> 8) & 0xff
    if (j < out.length) out[j++] = chunk & 0xff
  }
  return out
}

const ENCODINGS = [
  { id: 'hex', label: 'Hex' },
  { id: 'base64', label: 'Base64' },
] as const
type Encoding = (typeof ENCODINGS)[number]['id']

function encodeBytes(bytes: Uint8Array, encoding: Encoding): string {
  return encoding === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes)
}

function decodeBytes(text: string, encoding: Encoding): Uint8Array {
  return encoding === 'hex' ? hexToBytes(text) : base64ToBytes(text)
}

const ADDRESS_TYPES = [
  { type: AddressType.NESTED_PUBKEY_HASH, label: 'P2SH-P2WPKH' },
  { type: AddressType.WITNESS_PUBKEY_HASH, label: 'P2WPKH' },
  { type: AddressType.MWEB, label: 'MWEB' },
] as const

const MAX_TRANSACTIONS = 50

export default function WalletScreen() {
  const [balance, setBalance] = useState<{
    total: bigint
    confirmed: bigint
    unconfirmed: bigint
  } | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(1)
  const [transactions, setTransactions] = useState<
    { hash: string; amount: string; confirmations: number }[]
  >([])
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [liveTxCount, setLiveTxCount] = useState(0)
  const subscriptionRef = useRef<Subscription | null>(null)
  const [presignInput, setPresignInput] = useState('')
  const [presignOutput, setPresignOutput] = useState<Uint8Array | null>(null)
  const [presignEncoding, setPresignEncoding] = useState<Encoding>('hex')

  useEffect(() => {
    return () => {
      subscriptionRef.current?.cancel()
    }
  }, [])

  const handleGetBalance = async () => {
    try {
      setError(null)
      const response = await walletBalance({})
      setBalance({
        total: response.totalBalance,
        confirmed: response.confirmedBalance,
        unconfirmed: response.unconfirmedBalance,
      })
    } catch (e: any) {
      setError(`Balance: ${e.message}`)
    }
  }

  const handleNewAddress = async () => {
    try {
      setError(null)
      const selected = ADDRESS_TYPES[selectedAddrIdx]
      const response = await newAddress({ type: selected.type })
      setAddress(response.address)
    } catch (e: any) {
      setError(`Address: ${e.message}`)
    }
  }

  const handleGetTransactions = async () => {
    try {
      setError(null)
      const response = await getTransactions({})
      setTransactions(
        response.transactions.slice(0, MAX_TRANSACTIONS).map((tx) => ({
          hash: tx.txHash,
          amount: tx.amount.toString(),
          confirmations: tx.numConfirmations,
        }))
      )
    } catch (e: any) {
      setError(`Transactions: ${e.message}`)
    }
  }

  const handlePrepareMwebPresign = async () => {
    try {
      setError(null)
      setPresignOutput(null)
      const fundedPsbt = decodeBytes(presignInput, presignEncoding)
      const response = await walletKitPrepareMwebPresign({ fundedPsbt })
      setPresignOutput(response.preparedPsbt)
    } catch (e: any) {
      setError(`PrepareMwebPresign: ${e.message}`)
    }
  }

  const handleEncodingChange = (next: Encoding) => {
    if (next === presignEncoding) return
    setPresignEncoding(next)
    setPresignInput('')
  }

  const handleToggleSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.cancel()
      subscriptionRef.current = null
      setIsSubscribed(false)
      return
    }
    setLiveTxCount(0)
    subscriptionRef.current = subscribeTransactions(
      {},
      (tx) => {
        setLiveTxCount((prev) => prev + 1)
        setTransactions((prev) => [
          {
            hash: tx.txHash,
            amount: tx.amount.toString(),
            confirmations: tx.numConfirmations,
          },
          ...prev.slice(0, 19),
        ])
      },
      (err) => {
        setError(`Tx subscription: ${err}`)
        setIsSubscribed(false)
      }
    )
    setIsSubscribed(true)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Balance</Text>
        {balance ? (
          <>
            <Row label="Total" value={`${balance.total} sat`} />
            <Row label="Confirmed" value={`${balance.confirmed} sat`} />
            <Row label="Unconfirmed" value={`${balance.unconfirmed} sat`} />
          </>
        ) : (
          <Text style={styles.placeholder}>Press refresh to load</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={handleGetBalance}>
          <Text style={styles.buttonText}>Refresh Balance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New Address</Text>
        <View style={styles.toggleRow}>
          {ADDRESS_TYPES.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.toggleButton,
                idx === selectedAddrIdx && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setSelectedAddrIdx(idx)
                setAddress(null)
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  idx === selectedAddrIdx && styles.toggleTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {address ? (
          <Text style={styles.address} selectable>
            {address}
          </Text>
        ) : (
          <Text style={styles.placeholder}>Generate an address</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={handleNewAddress}>
          <Text style={styles.buttonText}>
            Generate {ADDRESS_TYPES[selectedAddrIdx].label} Address
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Transactions{liveTxCount > 0 ? ` (${liveTxCount} live)` : ''}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.halfButton]}
            onPress={handleGetTransactions}
          >
            <Text style={styles.buttonText}>Load History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.halfButton,
              isSubscribed && styles.dangerButton,
            ]}
            onPress={handleToggleSubscription}
          >
            <Text style={styles.buttonText}>
              {isSubscribed ? 'Stop Live' : 'Start Live'}
            </Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <Text style={styles.placeholder}>No transactions</Text>
        ) : (
          transactions.map((tx, i) => (
            <View key={tx.hash || i} style={styles.txRow}>
              <Text style={styles.txHash}>
                {tx.hash.length > 16 ? tx.hash.slice(0, 16) + '...' : tx.hash}
              </Text>
              <Text style={styles.txAmount}>{tx.amount} sat</Text>
              <Text style={styles.txConf}>{tx.confirmations} conf</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prepare MWEB Presign</Text>
        <Text style={styles.placeholder}>
          Paste a funded PSBT. The daemon attaches the MWEB sender key and
          stealth scalar presign fields so an external signer can complete
          the inputs and kernels.
        </Text>
        <View style={styles.toggleRow}>
          {ENCODINGS.map((enc) => (
            <TouchableOpacity
              key={enc.id}
              style={[
                styles.toggleButton,
                enc.id === presignEncoding && styles.toggleButtonActive,
              ]}
              onPress={() => handleEncodingChange(enc.id)}
            >
              <Text
                style={[
                  styles.toggleText,
                  enc.id === presignEncoding && styles.toggleTextActive,
                ]}
              >
                {enc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.psbtInput}
          value={presignInput}
          onChangeText={setPresignInput}
          placeholder={`funded psbt (${presignEncoding})`}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.button,
            !presignInput.trim() && styles.buttonDisabled,
          ]}
          onPress={handlePrepareMwebPresign}
          disabled={!presignInput.trim()}
        >
          <Text style={styles.buttonText}>Prepare Presign</Text>
        </TouchableOpacity>
        {presignOutput !== null && (
          <>
            <Text style={styles.rowLabel}>
              Prepared PSBT ({presignEncoding}) — {presignOutput.length} bytes
            </Text>
            <Text style={styles.address} selectable>
              {presignOutput.length > 0
                ? encodeBytes(presignOutput, presignEncoding)
                : '(empty)'}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: '#888', fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  placeholder: { color: '#aaa', fontSize: 14, fontStyle: 'italic' },
  address: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#345d9d',
    padding: 8,
    backgroundColor: '#f0f4f8',
    borderRadius: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#345d9d',
    borderColor: '#345d9d',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  toggleTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#345d9d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#9aa8c3' },
  dangerButton: { backgroundColor: '#c0392b' },
  psbtInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    minHeight: 80,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  halfButton: { flex: 1 },
  errorCard: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#c0392b', fontSize: 13 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  txHash: { fontSize: 12, fontFamily: 'monospace', color: '#555', flex: 1 },
  txAmount: { fontSize: 12, fontWeight: '500', marginHorizontal: 8 },
  txConf: { fontSize: 12, color: '#888' },
})
