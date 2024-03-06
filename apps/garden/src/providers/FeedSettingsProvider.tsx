import { useLocalStorage } from '@mantine/hooks'
import React, { ReactElement, createContext, useEffect, useState } from 'react'

export enum FilterName {
  Type = 'type',
  Visibility = 'visibility',
}

export type FeedSettingItem = { [key: string]: boolean }

export interface FilterSettings {
  [FilterName.Type]: FeedSettingItem
  [FilterName.Visibility]: FeedSettingItem
}

export interface ViewSettings {
  imageSize: 'small' | 'medium' | 'large'
  gridImageStyle: 'contain' | 'cover'
}

// export interface FeedSettings extends ViewSettings {
//   type: FeedSettingItem
//   visibility: FeedSettingItem
// }

export interface FeedSettings extends ViewSettings {
  [FilterName.Type]: FeedSettingItem
  [FilterName.Visibility]: FeedSettingItem
}

// export type FilterName = string

interface SettingsContextProps {
  feedSettings: FeedSettings
  filters: Partial<FilterSettings>[]
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
  filters: [],
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

  const [filters, setFilters] = useState<Partial<FilterSettings>[]>([])

  const updateFeedSettings = (
    newSettings: (current: FeedSettings) => FeedSettings,
  ) => {
    setFeedSettings(newSettings(feedSettings))
  }

  useEffect(() => {
    const filterItems = Object.keys(feedSettings)
      .filter((key): key is FilterName =>
        Object.values(FilterName).includes(key as FilterName),
      )
      .map(
        filterName =>
          ({
            [filterName]: feedSettings[filterName],
          } as Partial<FilterSettings>),
      )

    console.log({ filterItems })
    setFilters(filterItems)
  }, [feedSettings])

  return (
    <FeedSettingsContext.Provider
      value={{ feedSettings, filters, updateFeedSettings }}
    >
      {children}
    </FeedSettingsContext.Provider>
  )
}

export default FeedSettingsProvider
