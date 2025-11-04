import React, { PropsWithChildren } from 'react'

export default function ChatLayout({
  children,
  creationModal,
}: PropsWithChildren<{ creationModal?: React.ReactNode }>) {
  return (
    <>
      {children}
      {creationModal}
    </>
  )
}
