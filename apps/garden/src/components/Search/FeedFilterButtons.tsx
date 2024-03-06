import {
  FeedSettingItem,
  FeedSettingsContext,
  FilterName,
} from '@/providers/FeedSettingsProvider'
import { useContext } from 'react'

export type FeedSettingItemKey = keyof FeedSettingItem

const FeedFilterButtons = () => {
  const { feedSettings, updateFeedSettings } = useContext(FeedSettingsContext)

  const { ...filterSettings } = feedSettings

  const handleButtonClick = (
    filterName: FilterName,
    itemKey: FeedSettingItemKey,
  ) => {
    updateFeedSettings(current => {
      const updatedSettings = { ...current }
      if (
        updatedSettings[filterName] &&
        itemKey in updatedSettings[filterName]
      ) {
        updatedSettings[filterName][itemKey] = false
      }
      return updatedSettings
    })
  }

  return (
    <>
      {Object.keys(filterSettings)
        .filter((filterName): filterName is FilterName =>
          Object.values(FilterName).includes(filterName as FilterName),
        )
        .map(filterName =>
          Object.keys(filterSettings[filterName])
            .filter(itemKey => filterSettings[filterName][itemKey])
            .map(itemKey => (
              <button
                onClick={() =>
                  handleButtonClick(
                    filterName as FilterName,
                    itemKey as FeedSettingItemKey,
                  )
                }
                key={itemKey}
              >
                {itemKey}
              </button>
            )),
        )}
    </>
  )
}

export default FeedFilterButtons
