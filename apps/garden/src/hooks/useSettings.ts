import { useCallback, useState } from 'react'

const GridSettingParams = {
  displayName: 'Max Columns',
  defaultValue: 4,
  min: 1,
  max: 12,
}

export type GridSetting = {
  value: number | undefined
  params: typeof GridSettingParams
}

export type SettingName = 'maxGridCols'

export interface Settings {
  maxGridCols: GridSetting
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    maxGridCols: {
      value: undefined,
      params: GridSettingParams,
    },
  })

  const updateSetting = useCallback(
    (settingName: SettingName, newValue: number) => {
      const updatedSettings = { ...settings }
      updatedSettings[settingName].value = newValue

      //@todo: update localstorage persisted settings too

      setSettings(updatedSettings)
    },
    [settings],
  )

  // useEffect(() => {
  //   //@todo: fetch / initialize from local storage if available
  // }, [settings])

  return {
    settings,
    updateSetting,
  }
}
