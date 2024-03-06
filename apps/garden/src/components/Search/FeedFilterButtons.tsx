import {
  FeedSettingItem,
  FeedSettingsContext,
  FilterName,
} from '@/providers/FeedSettingsProvider'
import { Close } from '@mui/icons-material'
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
    <div className={`flex flex-wrap gap-1 px-2 mt-2 max-w-full`}>
      {Object.keys(filterSettings)
        .filter((filterName): filterName is FilterName =>
          Object.values(FilterName).includes(filterName as FilterName),
        )
        .map(filterName =>
          Object.keys(filterSettings[filterName])
            .filter(itemKey => filterSettings[filterName][itemKey])
            .map(itemKey => (
              <div
                onClick={() =>
                  handleButtonClick(
                    filterName as FilterName,
                    itemKey as FeedSettingItemKey,
                  )
                }
                key={itemKey}
                title={`Remove filter - ${filterName} '${itemKey}'`}
                className="flex items-center text-xs gap-1 px-1 rounded border border-solid border-blue-800 bg-blue-500 hover:bg-blue-800 hover:bg-opacity-75 bg-opacity-25 text-blue-300 cursor-pointer "
              >
                {itemKey}
                <Close fontSize="small" className="text-xs" />
              </div>
            )),
        )}
    </div>
  )
}

export default FeedFilterButtons
