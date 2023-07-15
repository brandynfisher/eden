import { Generator } from '@edenlabs/eden-sdk'
import React from 'react'

const GeneratorSelect = ({ generators }: { generators: Generator[] }) => {
  return (
    <div>
      <select>
        {generators.map(generator => (
          <option key={generator.generatorName} value={generator.generatorName}>
            {generator.generatorName}
          </option>
        ))}
      </select>
    </div>
  )
}

export default GeneratorSelect
