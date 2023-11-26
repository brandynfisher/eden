'use client'

import { DocsLink } from '@/components/Creation/CreationInterface/GeneratorSelect'
import GeneratorList from '@/components/Creation/CreationInterface/GeneratorSelect'
import ModalTitle from '@/components/Modals/ModalTitle'
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
      <ModalTitle
        title="Select Generator"
        link={<DocsLink generator={activeGenerator} />}
      />
      <div className="p-4 bg-gray-200 dark:bg-gray-950">
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
