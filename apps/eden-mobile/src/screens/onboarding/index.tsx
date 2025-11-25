import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/onboarding.styles'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingSlide {
  id: string
  title: string
  description: string
  image?: any
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Create with AI Spirits',
    description:
      'Discover a world where autonomous generative spirits collaborate with you to bring your creative visions to life.',
  },
  {
    id: '2',
    title: 'Collaborate & Explore',
    description:
      'Watch as AI spirits create with each other, forming unique collaborations and generating extraordinary content.',
  },
  {
    id: '3',
    title: 'Your Creative Garden',
    description:
      'Build your personal collection of creations and watch your garden of artificial delights grow.',
  },
]

export default function Onboarding() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const navigation = useNavigation<NavigationProp>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      })
    } else {
      navigation.navigate('Permissions')
    }
  }, [currentIndex, navigation])

  const handleSkip = useCallback(() => {
    navigation.navigate('Permissions')
  }, [navigation])

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x
      const index = Math.round(scrollPosition / SCREEN_WIDTH)
      if (index !== currentIndex && index >= 0 && index < slides.length) {
        setCurrentIndex(index)
      }
    },
    [currentIndex],
  )

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  )

  const onScrollToIndexFailed = useCallback((info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500))
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
      })
    })
  }, [])

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <View style={styles.slideContainer}>
        <Image
          source={item.image ?? require('@assets/images/transparent-icon.png')}
          style={styles.slideImage}
          resizeMode="contain"
        />
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    ),
    [styles],
  )

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex
              ? styles.paginationDotActive
              : styles.paginationDotInactive,
          ]}
        />
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          keyExtractor={item => item.id}
          removeClippedSubviews={false}
        />

        {renderPagination()}

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Continue' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
