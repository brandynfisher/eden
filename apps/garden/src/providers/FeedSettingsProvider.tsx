import { useLocalStorage } from '@mantine/hooks'
import React, { ReactElement, createContext, useEffect, useState } from 'react'

export enum FilterName {
  GeneratorId = 'generatorId',
  OutputType = 'outputType',
  Visibility = 'visibility',
}

export type FeedSettingItem = { [key: string]: boolean }

export interface FilterSettings {
  [FilterName.GeneratorId]: FeedSettingItem
  [FilterName.OutputType]: FeedSettingItem
  [FilterName.Visibility]: FeedSettingItem
}

export interface ViewSettings {
  imageSize: 'small' | 'medium' | 'large'
  gridImageStyle: 'contain' | 'cover'
}

export interface FeedSettings extends ViewSettings {
  [FilterName.GeneratorId]: FeedSettingItem
  [FilterName.OutputType]: FeedSettingItem
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
  generatorId: {
    story: false,
  },
  outputType: {
    image: false,
    video: false,
  },
  visibility: {
    private: false,
    public: false,
  },
  imageSize: 'medium',
  gridImageStyle: 'contain',
}

// export const FilterQueryConfig = {
//   image: {
//     'mediaAttributes.type': {
//       $eq: 'image',
//     },
//   },
//   video: {
//     'mediaAttributes.type': {
//       $eq: 'video',
//     },
//   },
//   story: {
//     generatorId: [
//       '6511d29ad2d97662167a76d6', // dialogue
//       '65047b5a5c9278a72cd0ae91', // monologue
//       '65a484ac4f1d544e3a1d9435', // story
//     ],
//   },
// }

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
