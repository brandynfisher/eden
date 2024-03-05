import { useLocalStorage } from '@mantine/hooks'
import React, { ReactElement, createContext } from 'react'

export type FeedSettingItem = { [key: string]: boolean }

export interface FilterSettings {
  type: FeedSettingItem
  visibility: FeedSettingItem
}

export interface ViewSettings {
  imageSize: 'small' | 'medium' | 'large'
  gridImageStyle: 'contain' | 'cover'
}

export interface FeedSettings extends ViewSettings {
  type: FeedSettingItem
  visibility: FeedSettingItem
}

interface SettingsContextProps {
  feedSettings: FeedSettings
  updateFeedSettings: (
    newSettings: (current: FeedSettings) => FeedSettings,
  ) => void
}

const feedSettingsContextDefaults: FeedSettings = {
  type: {
    image: false,
    video: false,
    story: false,
  },
  visibility: {
    private: false,
    public: false,
  },
  imageSize: 'medium',
  gridImageStyle: 'contain',
}

// Initialized context with default value to avoid the null checks in consumers
export const FeedSettingsContext = createContext<SettingsContextProps>({
  feedSettings: feedSettingsContextDefaults,
  updateFeedSettings: () => {},
})

export const FeedSettingsProvider = ({
  children,
}: {
  children: ReactElement
}) => {
  const [feedSettings, setFeedSettings] = useLocalStorage<FeedSettings>({
    key: 'feedSettings_v1',
    defaultValue: feedSettingsContextDefaults,
  })

  const updateFeedSettings = (
    newSettings: (current: FeedSettings) => FeedSettings,
  ) => {
    setFeedSettings(newSettings(feedSettings))
  }

  return (
    <FeedSettingsContext.Provider value={{ feedSettings, updateFeedSettings }}>
      {children}
    </FeedSettingsContext.Provider>
  )
}

export default FeedSettingsProvider
