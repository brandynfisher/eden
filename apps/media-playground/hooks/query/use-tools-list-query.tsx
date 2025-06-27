'use client'

import { ToolOutputTypeV2, ToolV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type UseToolsListQueryParams = {
  output_type?: ToolOutputTypeV2[]
}

export const useToolsListQuery = ({
  output_type = ['image', 'video', 'audio', 'lora'],
}: UseToolsListQueryParams = {}) => {
  const { data: tools, ...query } = useQuery({
    queryKey: ['tools', { output_type }],
    queryFn: async (): Promise<ToolV2[]> => {
      const { data } = await axios.get(
        `/api/tools?hideParams=true&output_type=${output_type.join(',')}`,
      )
      return data.tools
    },
  })

  return {
    tools,
    ...query,
  }
}
