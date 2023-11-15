'use client'

import { DocsLink } from '@/components/Creation/CreationInterface/GeneratorSelect'
import GeneratorList from '@/components/Creation/CreationInterface/GeneratorSelect'
import { Generator } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import React from 'react'

const GeneratorSelectModal = ({
  generators,
  activeGenerator,
  onChange,
  ...rest
}: {
  generators: Generator[]
  activeGenerator: Generator
  onChange: (generator: Generator) => void
}) => {
  return (
    <Modal
      {...rest}
      className="modal-small max-w-6xl flex flex-col w-full items-center justify-center"
    >
      <div className="flex justify-between items-center bg-gray-300 dark:bg-gray-800 rounded-t-lg h-14 px-4 py-2 flex-wrap">
        <div className="font-bold flex-shrink-0">Select Generator</div>
        <div className="flex justify-end flex-shrink-0 mr-10 lg:mr-6">
          <DocsLink generator={activeGenerator} />
        </div>
      </div>
      <div className="p-4 bg-gray-200 dark:bg-gray-900">
        <GeneratorList
          generators={generators}
          activeGenerator={activeGenerator}
          onSelect={onChange}
        />
      </div>
    </Modal>
  )
}

export default GeneratorSelectModal
