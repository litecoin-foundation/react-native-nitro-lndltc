import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {
  getInfo,
  getRecoveryInfo,
  neutrinoKitStatus,
} from 'react-native-nitro-lndltc'

export default function InfoScreen() {
  const [nodeInfo, setNodeInfo] = useState<Record<string, string> | null>(null)
  const [recoveryInfo, setRecoveryInfo] = useState<Record<
    string,
    string
  > | null>(null)
  const [neutrinoInfo, setNeutrinoInfo] = useState<Record<
    string,
    string
  > | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetInfo = async () => {
    try {
      setError(null)
      const info = await getInfo()
      setNodeInfo({
        'Version': info.version,
        'Pubkey': info.identityPubkey.slice(0, 20) + '...',
        'Alias': info.alias || '(none)',
        'Block Height': info.blockHeight.toString(),
        'Synced to Chain': info.syncedToChain ? 'Yes' : 'No',
        'Synced to Graph': info.syncedToGraph ? 'Yes' : 'No',
        'Active Channels': info.numActiveChannels.toString(),
        'Peers': info.numPeers.toString(),
      })
    } catch (e: any) {
      setError(`GetInfo: ${e.message}`)
    }
  }

  const handleGetRecoveryInfo = async () => {
    try {
      setError(null)
      const info = await getRecoveryInfo()
      setRecoveryInfo({
        'Recovery Mode': info.recoveryMode ? 'Yes' : 'No',
        'Recovery Finished': info.recoveryFinished ? 'Yes' : 'No',
        'Progress': `${(info.progress * 100).toFixed(1)}%`,
      })
    } catch (e: any) {
      setError(`Recovery: ${e.message}`)
    }
  }

  const handleNeutrinoStatus = async () => {
    try {
      setError(null)
      const status = await neutrinoKitStatus()
      setNeutrinoInfo({
        'Active': status.active ? 'Yes' : 'No',
        'Synced': status.synced ? 'Yes' : 'No',
        'Block Height': status.blockHeight.toString(),
        'Block Hash': status.blockHash.slice(0, 20) + '...',
        'Peers': status.peers.length.toString(),
      })
    } catch (e: any) {
      setError(`Neutrino: ${e.message}`)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <InfoCard title="Node Info" data={nodeInfo} onRefresh={handleGetInfo} />

      <InfoCard
        title="Recovery Info"
        data={recoveryInfo}
        onRefresh={handleGetRecoveryInfo}
      />

      <InfoCard
        title="Neutrino Status"
        data={neutrinoInfo}
        onRefresh={handleNeutrinoStatus}
      />
    </ScrollView>
  )
}

function InfoCard({
  title,
  data,
  onRefresh,
}: {
  title: string
  data: Record<string, string> | null
  onRefresh: () => void
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {data ? (
        Object.entries(data).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{key}</Text>
            <Text style={styles.rowValue} selectable>
              {value}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.placeholder}>Press refresh to load</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={onRefresh}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: { color: '#888', fontSize: 14 },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  placeholder: { color: '#aaa', fontSize: 14, fontStyle: 'italic' },
  button: {
    backgroundColor: '#345d9d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  errorCard: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#c0392b', fontSize: 13 },
})
