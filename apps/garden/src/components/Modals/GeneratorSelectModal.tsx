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
      className="modal-small max-w-4xl flex flex-col w-full items-center justify-center"
    >
      <div className="p-4 h-11 flex items-center font-bold bg-gray-300 dark:bg-gray-800 rounded-t-lg">
        Select Generator
      </div>
      <div className="p-4 bg-gray-200 dark:bg-gray-900">
        <div className="flex justify-end w-full lg:mb-2">
          <DocsLink generator={activeGenerator} />
        </div>
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
