import { useLocalStorage } from '@mantine/hooks'
import { useCallback, useState } from 'react'

const GridSettingParams = {
  displayName: 'Grid Columns',
  initialValue: 4,
  defaultValue: 'auto',
  min: 1,
  max: 12,
}

export type GridSetting = {
  value: number | 'auto'
  params: typeof GridSettingParams
}

export type SettingName = 'maxGridCols'

export interface Settings {
  maxGridCols: GridSetting
}

export const useSettings = () => {
  const [maxGridColsValue, setMaxGridColsValue] = useLocalStorage<
    number | 'auto'
  >({ key: 'maxGridCols', defaultValue: 'auto' })

  const [settings, setSettings] = useState<Settings>({
    maxGridCols: {
      value: maxGridColsValue,
      params: GridSettingParams,
    },
  })

  const updateSetting = useCallback(
    (settingName: SettingName, newValue: number | 'auto') => {
      const updatedSettings = { ...settings }
      updatedSettings[settingName].value = newValue

      if (settingName === 'maxGridCols') {
        setMaxGridColsValue(newValue)
      }

      setSettings(updatedSettings)
    },
    [settings],
  )

  return {
    settings,
    updateSetting,
  }
}
