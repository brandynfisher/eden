import Splash from '@/screens/splash'
import Webview from '@/screens/webview'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Splash: undefined
  Webview: undefined
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
      <Stack.Screen name="Webview" component={Webview} />
    </Stack.Navigator>
  )
}
