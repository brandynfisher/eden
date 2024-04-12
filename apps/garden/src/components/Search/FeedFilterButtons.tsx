import {
  FeedSettingItem,
  FeedSettingsContext,
  FilterName,
} from '@/providers/FeedSettingsProvider'
import { Close } from '@mui/icons-material'
import { useRouter } from 'next/router'
import { useContext } from 'react'

export type FeedSettingItemKey = keyof FeedSettingItem

const FeedFilterButton = ({
  filterName,
  itemKey,
  handleClick,
}: {
  filterName: FilterName
  itemKey: FeedSettingItemKey | string
  handleClick: () => void
}) => {
  return (
    <div
      onClick={() => handleClick()}
      title={`Remove filter - ${filterName} '${itemKey}'`}
      className="flex items-center text-xs gap-1 px-1 rounded border border-solid border-blue-800 bg-blue-500 hover:bg-blue-300 hover:dark:bg-blue-800 hover:bg-opacity-75 bg-opacity-25 text-blue-700 dark:text-blue-300 cursor-pointer "
    >
      {itemKey}
      <Close fontSize="small" className="!text-xs" />
    </div>
  )
}

const FeedFilterButtons = () => {
  const { feedSettings, updateFeedSettings } = useContext(FeedSettingsContext)
  const router = useRouter()
  const pathname = router.pathname
  const { ...filterSettings } = feedSettings

  const handleButtonClick = (
    filterName: FilterName,
    itemKey: FeedSettingItemKey,
  ) => {
    updateFeedSettings(current => {
      const updatedSettings = { ...current }

      if (typeof updatedSettings[filterName] === 'string') {
        //@ts-ignore
        updatedSettings[filterName] = 'all'
      } else if (
        updatedSettings[filterName] &&
        //@ts-ignore
        itemKey in updatedSettings[filterName]
      ) {
        //@ts-ignore
        updatedSettings[filterName][itemKey] = false
      }
      return updatedSettings
    })
  }

  return (
    <div className={`flex flex-wrap gap-1 px-2 my-2 max-w-full`}>
      {Object.keys(filterSettings)
        .filter((filterName): filterName is FilterName =>
          Object.values(FilterName).includes(filterName as FilterName),
        )
        .map(filterName => {
          if (typeof filterSettings[filterName] === 'string') {
            if (
              pathname.startsWith('/creators/[id]') &&
              filterSettings[filterName] !== 'all'
            ) {
              return (
                <FeedFilterButton
                  key={filterName}
                  //@ts-ignore
                  itemKey={filterSettings[filterName]}
                  filterName={filterName}
                  handleClick={() =>
                    handleButtonClick(
                      filterName as FilterName,
                      filterSettings[filterName] as FeedSettingItemKey,
                    )
                  }
                />
              )
            }
          } else {
            return (
              Object.keys(filterSettings[filterName])
                //@ts-ignore
                .filter(itemKey => filterSettings[filterName][itemKey])
                .map(itemKey => (
                  <FeedFilterButton
                    key={itemKey}
                    filterName={filterName}
                    itemKey={itemKey}
                    handleClick={() =>
                      handleButtonClick(
                        filterName as FilterName,
                        itemKey as FeedSettingItemKey,
                      )
                    }
                  />
                ))
            )
          }
        })}
    </div>
  )
}

export default FeedFilterButtons
