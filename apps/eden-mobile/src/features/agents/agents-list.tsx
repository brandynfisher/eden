import DeleteAccountButton from '@/components/auth/delete-account-button'
import LoginButton from '@/components/auth/login-button'
import LogoutButton from '@/components/auth/logout-button'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { config } from '@/lib/config'
import createStyles from '@/styles/agents-list.styles'
import type { Agent, AgentsListResponse } from '@/types/Agent'
import { useAuth } from '@clerk/clerk-expo'
import { TypographyH1 } from '@edenlabs/eden-react'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

export default function AgentsList() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const colors = Colors[theme]
  const styles = createStyles(theme)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${config.API_URL}/v2/agents?limit=10`)
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

  const renderAgent = ({ item }: { item: Agent }) => {
    return (
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
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Fetching public agents...</Text>
        </View>
      )
    }

    if (errorMessage) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Could not load agents</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <Text style={styles.errorHint}>
            Make sure the Eden API is running at {config.API_URL}.
          </Text>
        </View>
      )
    }

    return (
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        data={agents}
        keyExtractor={item => item._id}
        renderItem={renderAgent}
        ListEmptyComponent={() => (
          <Text style={styles.emptyState}>No public agents found.</Text>
        )}
      />
    )
  }

  return <AgentsListView renderContent={renderContent} />
}

const AgentsListView = ({
  renderContent,
}: {
  renderContent: () => JSX.Element
}) => {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const { isSignedIn } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <TypographyH1 style={styles.title as any}>Eden Mobile</TypographyH1>
            <Text style={styles.subtitle}>
              Shared UI + live data from the Eden API.
            </Text>
          </View>
          {!isSignedIn && <LoginButton />}
          {isSignedIn && (
            <View style={styles.authButtons}>
              <LogoutButton />
              <DeleteAccountButton />
            </View>
          )}
        </View>
      </View>
      {renderContent()}
    </View>
  )
}
