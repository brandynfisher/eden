import BottomTabsNavigator from './bottom-tabs'
import Onboarding from '@/screens/onboarding'
import Permissions from '@/screens/permissions'
import Splash from '@/screens/splash'
import Welcome from '@/screens/welcome'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Splash: undefined
  Welcome: undefined
  Onboarding: undefined
  Permissions: undefined
  BottomTabs: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Navigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Permissions" component={Permissions} />
      <Stack.Screen name="BottomTabs" component={BottomTabsNavigator} />
    </Stack.Navigator>
  )
}
