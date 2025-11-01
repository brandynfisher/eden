import { TypographyH1 } from '@edenlabs/eden-react'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const LOCAL_API_HOST = Platform.select({
  ios: 'http://127.0.0.1:5050',
  android: 'http://10.0.2.2:5050',
  default: 'http://localhost:5050',
})

const API_URL = process.env.EXPO_PUBLIC_EDEN_API_URL ?? LOCAL_API_HOST

type Agent = {
  _id: string
  name?: string
  description?: string
  user?: {
    username?: string
  }
}

type AgentsListResponse = {
  docs?: Agent[]
  error?: string
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/v2/agents?limit=10`)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: AgentsListResponse = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }

        setAgents(data.docs ?? [])
        setErrorMessage(null)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred'
        setErrorMessage(message)
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const renderAgent = ({ item }: { item: Agent }) => (
    <View style={styles.agentItem}>
      <Text style={styles.agentName}>{item.name ?? 'Unnamed agent'}</Text>
      {item.user?.username ? (
        <Text style={styles.agentMeta}>@{item.user.username}</Text>
      ) : null}
      {item.description ? (
        <Text numberOfLines={2} style={styles.agentDescription}>
          {item.description}
        </Text>
      ) : (
        <Text style={styles.agentDescriptionMuted}>
          No description provided.
        </Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TypographyH1 style={styles.title}>Eden Mobile</TypographyH1>
        <Text style={styles.subtitle}>
          Shared UI + live data from the Eden API.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loaderText}>Fetching public agents...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Could not load agents</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <Text style={styles.errorHint}>
            Make sure the Eden API is running at {API_URL}.
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={agents}
          keyExtractor={item => item._id}
          renderItem={renderAgent}
          ListEmptyComponent={() => (
            <Text style={styles.emptyState}>No public agents found.</Text>
          )}
        />
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f4' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555555',
    lineHeight: 21,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555555',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c0392b',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  list: {
    flex: 1,
  },
  agentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  agentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  agentMeta: { fontSize: 13, color: '#6c5ce7', marginBottom: 6 },
  agentDescription: { fontSize: 13, color: '#2d3436', lineHeight: 18 },
  agentDescriptionMuted: { fontSize: 13, color: '#95a5a6' },
  emptyState: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 24,
  },
})
