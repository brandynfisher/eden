import React, { PropsWithChildren } from 'react'

interface LayoutProps {
  creationModal: React.ReactNode
}

export default function ChatLayout({
  children,
  creationModal,
}: PropsWithChildren<LayoutProps>) {
  return (
    <>
      {children}
      {creationModal}
    </>
  )
}
