import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {
  walletBalance,
  newAddress,
  getTransactions,
  subscribeTransactions,
  AddressType,
  type Subscription,
} from 'react-native-nitro-lndltc'

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  dangerButton: { backgroundColor: '#c0392b' },
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
