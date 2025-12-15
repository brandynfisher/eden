import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import Settings from '@/screens/settings'
import Webview from '@/screens/webview'
import createStyles from '@/styles/bottom-tabs.styles'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type BottomTabsParamList = {
  Webview: { resetToken?: number; targetUrl?: string } | undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<BottomTabsParamList>()

export default function BottomTabsNavigator() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const colors = Colors[theme]
  const insets = useSafeAreaInsets()
  const styles = createStyles(theme, insets.bottom)

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}
    >
      <Tab.Screen
        name="Webview"
        component={Webview}
        options={{
          tabBarLabel: 'App',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="apps" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
