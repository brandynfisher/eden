import { useEdenState } from '@/hooks/useEdenState'
import { sdxl_generators_image } from '@/lib/generator'
import { Generator } from '@edenlabs/eden-sdk'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useEffect, useState } from 'react'

const GeneratorFilter = () => {
  const { generators } = useEdenState()
  const [availableGenerators, setAvailableGenerators] = useState<Generator[]>(
    [],
  )

  useEffect(() => {
    if (generators && generators.length) {
      setAvailableGenerators(
        generators.filter(generator =>
          sdxl_generators_image.includes(generator.generatorName),
        ),
      )
    }
  }, [generators])

  if (!availableGenerators.length) {
    return null
  }

  return (
    <Autocomplete
      multiple
      limitTags={2}
      size="small"
      id="multiple-limit-tags"
      options={availableGenerators}
      getOptionLabel={option => option.generatorName}
      defaultValue={availableGenerators}
      renderInput={params => <TextField {...params} label="Generators" />}
      sx={{ width: '270px' }}
    />
  )
}

export default GeneratorFilter
