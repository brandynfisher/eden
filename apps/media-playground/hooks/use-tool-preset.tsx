'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type GenericValues = {
  [p: string]: number | string | undefined | boolean | null
}

export const useToolPreset = () => {
  const [presetValues, setPresetValues] = useState<GenericValues | false>(false)
  const queryParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    console.log(queryParams, pathname)
    const query =
      queryParams.size > 0
        ? {
            lora: queryParams.get('lora'),
          }
        : undefined

    if (query) {
      // presetValues?.lora && form.setValue('use_lora', true);
      // presetValues?.lora && form.setValue('lora', presetValues?.lora);
      // setShouldOpenSettings(true)
      if (query.lora) {
        setPresetValues({
          use_lora: true,
          lora: query?.lora,
        })
      } else {
        setPresetValues({
          prompt: 'balbalbalblab',
          width: 512,
        })
      }
    } else {
      setPresetValues(false)
    }
    // }, [defaultValues, form.setValue, queryParams]);
  }, [pathname, queryParams])

  return presetValues
}
