'use client'

// import { Concept } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import React from 'react'

const GeneratorSelectModal = ({
  // onChange,
  ...rest
}: {
  // onChange: (concept: Concept) => void
}) => {
  return (
    <Modal
      {...rest}
      className="modal-small max-w-6xl flex flex-col w-full items-center justify-center"
    >
      Concepts
    </Modal>
  )
}

export default GeneratorSelectModal
