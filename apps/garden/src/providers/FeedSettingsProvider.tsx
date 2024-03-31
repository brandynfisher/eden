import { useLocalStorage } from '@mantine/hooks'
import React, { ReactElement, createContext, useEffect, useState } from 'react'

export enum FilterName {
  GeneratorId = 'generatorId',
  OutputType = 'outputType',
  Visibility = 'visibility',
}

export type FeedSettingItem = { [key: string]: boolean }
export type FeedSettingItemSingle = string

export interface FilterSettings {
  [FilterName.GeneratorId]: FeedSettingItem
  [FilterName.OutputType]: FeedSettingItem
  [FilterName.Visibility]: FeedSettingItemSingle
}

export interface ViewSettings {
  imageSize: 'small' | 'medium' | 'large'
  gridImageStyle: 'contain' | 'cover'
}

export interface FeedSettings extends ViewSettings {
  [FilterName.GeneratorId]: FeedSettingItem
  [FilterName.OutputType]: FeedSettingItem
  [FilterName.Visibility]: FeedSettingItemSingle
}

interface SettingsContextProps {
  feedSettings: FeedSettings
  filters: Partial<FilterSettings>[]
  updateFeedSettings: (
    newSettings: (current: FeedSettings) => FeedSettings,
  ) => void
}

const feedSettingsContextDefaults: FeedSettings = {
  [FilterName.GeneratorId]: {
    create: false,
    story: false,
    upscale: false,
    controlnet: false,
    txt2vid: false,
    img2vid: false,
    vid2vid: false,
  },
  [FilterName.OutputType]: {
    image: false,
    video: false,
  },
  [FilterName.Visibility]: 'all',
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
    key: 'feedSettings_v4',
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
      .filter((key): key is FilterName => {
        return Object.values(FilterName).includes(key as FilterName)
      })
      .map(filterName => {
        return {
          [filterName]: feedSettings[filterName],
        } as Partial<FilterSettings>
      })
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
