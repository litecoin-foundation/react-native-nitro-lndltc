import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native'
import { Directory, File, Paths } from 'expo-file-system'
import {
  start,
  subscribeState,
  genSeed,
  unlockWallet,
  initWallet,
  stopDaemon,
  WalletState,
  type Subscription,
} from 'react-native-nitro-lndltc'

const LND_CONF = `[Application Options]
debuglevel=info
maxbackoff=2s
norest=1
nolisten=1
sync-freelist=1
accept-keysend=1
tlsdisableautofill=1

[Routing]
routing.assumechanvalid=1

[Litecoin]
litecoin.active=1
litecoin.mainnet=1
litecoin.node=electrum

[electrum]
electrum.server=fallacy.fiatfaucet.com:50002
electrum.resturl=https://litecoinspace.org/api
electrum.ssl=true
`

type DaemonPhase =
  | 'stopped'
  | 'starting'
  | 'needs_wallet'
  | 'needs_unlock'
  | 'active'

function phaseLabel(phase: DaemonPhase, rawState: WalletState | null): string {
  if (phase === 'stopped') return 'NOT STARTED'
  if (rawState === null) return 'STARTING...'
  return WalletState[rawState] ?? `UNKNOWN(${rawState})`
}

export default function DaemonScreen() {
  const [phase, setPhase] = useState<DaemonPhase>('stopped')
  const [rawState, setRawState] = useState<WalletState | null>(null)
  const [password, setPassword] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const subscriptionRef = useRef<Subscription | null>(null)

  const log = useCallback((msg: string) => {
    const entry = `${new Date().toLocaleTimeString()} ${msg}`
    console.log(`[LndExample] ${msg}`)
    setLogs((prev) => [...prev.slice(-29), entry])
  }, [])

  useEffect(() => {
    return () => {
      subscriptionRef.current?.cancel()
    }
  }, [])

  const getLndDir = () => {
    const docUri = Paths.document.uri
    const docPath = docUri.replace(/^file:\/\//, '')
    return `${docPath}/lnd`
  }

  const ensureLndConf = () => {
    const lndDirUri = `${Paths.document.uri}/lnd`
    const lndDir = new Directory(lndDirUri)
    if (!lndDir.exists) {
      lndDir.create()
    }
    const confFile = new File(`${lndDirUri}/lnd.conf`)
    confFile.write(LND_CONF)
    log(`Config written to ${getLndDir()}/lnd.conf`)
  }

  const handleStart = async () => {
    try {
      setPhase('starting')
      log('Starting lndltc daemon...')

      ensureLndConf()
      const lndDir = getLndDir()

      await start(`--lnddir=${lndDir}`)
      log('Daemon started, subscribing to state...')

      subscriptionRef.current = subscribeState(
        (response) => {
          setRawState(response.state)
          const label =
            WalletState[response.state] ?? `UNKNOWN(${response.state})`
          log(`State: ${label}`)

          if (response.state === WalletState.NON_EXISTING) {
            setPhase('needs_wallet')
          } else if (response.state === WalletState.LOCKED) {
            setPhase('needs_unlock')
          } else if (
            response.state === WalletState.SERVER_ACTIVE ||
            response.state === WalletState.RPC_ACTIVE ||
            response.state === WalletState.UNLOCKED
          ) {
            setPhase('active')
          }
        },
        (error) => {
          log(`State error: ${error}`)
        }
      )
    } catch (e: any) {
      log(`Start error: ${e.message}`)
      setPhase('stopped')
    }
  }

  const handleCreateWallet = async () => {
    if (password.length < 8) {
      log('Password must be at least 8 characters')
      return
    }
    try {
      log('Generating seed...')
      const seed = await genSeed({})
      log(`Seed: ${seed.cipherSeedMnemonic.slice(0, 3).join(' ')}...`)

      log('Creating wallet...')
      const response = await initWallet({
        walletPassword: new TextEncoder().encode(password),
        cipherSeedMnemonic: seed.cipherSeedMnemonic,
      })
      log(`Wallet created (macaroon: ${response.adminMacaroon.length} bytes)`)
    } catch (e: any) {
      log(`Create wallet error: ${e.message}`)
    }
  }

  const handleUnlock = async () => {
    if (password.length < 8) {
      log('Password must be at least 8 characters')
      return
    }
    try {
      log('Unlocking wallet...')
      await unlockWallet({
        walletPassword: new TextEncoder().encode(password),
      })
      log('Wallet unlock requested')
    } catch (e: any) {
      log(`Unlock error: ${e.message}`)
    }
  }

  const handleStop = async () => {
    try {
      log('Stopping daemon...')
      subscriptionRef.current?.cancel()
      subscriptionRef.current = null
      await stopDaemon()
      setPhase('stopped')
      setRawState(null)
      log('Daemon stopped')
    } catch (e: any) {
      log(`Stop error: ${e.message}`)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Wallet State</Text>
        <Text style={styles.statusValue}>{phaseLabel(phase, rawState)}</Text>
      </View>

      <View style={styles.section}>
        {phase === 'stopped' && (
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Start Daemon</Text>
          </TouchableOpacity>
        )}

        {phase === 'starting' && (
          <View style={[styles.button, styles.disabledButton]}>
            <Text style={styles.buttonText}>Starting...</Text>
          </View>
        )}

        {(phase === 'needs_wallet' || phase === 'needs_unlock') && (
          <WalletAuthForm
            phase={phase}
            password={password}
            onChangePassword={setPassword}
            onAction={
              phase === 'needs_wallet' ? handleCreateWallet : handleUnlock
            }
            onStop={handleStop}
          />
        )}

        {phase === 'active' && (
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleStop}
          >
            <Text style={styles.buttonText}>Stop Daemon</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.logSection}>
        <Text style={styles.logTitle}>Log</Text>
        {logs.map((entry, i) => (
          <Text key={i} style={styles.logEntry}>
            {entry}
          </Text>
        ))}
      </View>
    </ScrollView>
  )
}

function WalletAuthForm({
  phase,
  password,
  onChangePassword,
  onAction,
  onStop,
}: {
  phase: 'needs_wallet' | 'needs_unlock'
  password: string
  onChangePassword: (v: string) => void
  onAction: () => void
  onStop: () => void
}) {
  const isCreate = phase === 'needs_wallet'
  return (
    <>
      <Text style={styles.hint}>
        {isCreate
          ? 'No wallet found. Enter a password (min 8 chars) to create one.'
          : 'Wallet is locked. Enter your password to unlock.'}
      </Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={onChangePassword}
        placeholder={isCreate ? 'New wallet password' : 'Wallet password'}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>
          {isCreate ? 'Create Wallet' : 'Unlock Wallet'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={onStop}
      >
        <Text style={styles.buttonText}>Stop Daemon</Text>
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statusLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
  statusValue: { fontSize: 24, fontWeight: '700', color: '#345d9d' },
  section: { gap: 10 },
  hint: { fontSize: 14, color: '#555', lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#345d9d',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  dangerButton: { backgroundColor: '#c0392b' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  logTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  logEntry: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#555',
    lineHeight: 16,
  },
})
