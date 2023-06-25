import { ConnectButton as RainbowkitConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from 'antd'
import ButtonGroup from 'antd/es/button/button-group'
import React from 'react'

function ConnectButton() {
  return (
    <RainbowkitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal}>Connect Wallet</Button>
                )
              }

              if (chain.unsupported) {
                return <Button onClick={openChainModal}>Wrong network</Button>
              }

              return (
                <ButtonGroup>
                  <Button
                    onClick={openChainModal}
                    className="flex items-center"
                    type="dashed"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>
                  <Button type="dashed" onClick={openAccountModal}>
                    {account.displayName}
                  </Button>
                </ButtonGroup>
              )
            })()}
          </div>
        )
      }}
    </RainbowkitConnectButton.Custom>
  )
}

export default ConnectButton
