import WalletCustomAvatar from '@/components/WalletCustomAvatar'
import { CONFIG } from '@/lib/config'
import { ParticleNetwork, WalletEntryPosition } from '@particle-network/auth'
import { particleWallet } from '@particle-network/rainbowkit-ext'
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import {
  argentWallet,
  coinbaseWallet,
  imTokenWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  omniWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { useTheme } from 'next-themes'
import { PropsWithChildren, useEffect, useState } from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { arbitrum, mainnet, optimism, polygon, sepolia } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'

new ParticleNetwork({
  projectId: CONFIG.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
  clientKey: CONFIG.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
  appId: CONFIG.NEXT_PUBLIC_PARTICLE_APP_ID,
  wallet: {
    defaultWalletEntryPosition: WalletEntryPosition.BL,
  },
  // chainId: sepolia.id,
  // chainName: 'ethereum',
})

const { chains, publicClient } = configureChains(
  [arbitrum, mainnet, optimism, polygon, sepolia],
  [
    alchemyProvider({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_SEPOLIA as string,
    }),
    publicProvider(),
  ],
)

const particleWallets =
  typeof window !== 'undefined'
    ? [
        particleWallet({ chains, authType: 'email' }),
        particleWallet({ chains, authType: 'phone' }),
        particleWallet({ chains, authType: 'google' }),
        particleWallet({ chains }),
      ]
    : []

const popularWallets = {
  groupName: 'Popular',
  wallets: [
    ...particleWallets,
    injectedWallet({ chains }),
    rainbowWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
    coinbaseWallet({ appName: 'Eden', chains }),
    metaMaskWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
    walletConnectWallet({
      chains,
      projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID,
    }),
  ],
}

const connectors = connectorsForWallets([
  popularWallets,
  {
    groupName: 'Other',
    wallets: [
      argentWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
      trustWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
      omniWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
      imTokenWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
      ledgerWallet({ chains, projectId: CONFIG.NEXT_PUBLIC_WALLETCONNECT_ID }),
    ],
  },
])

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

function WalletProviderSepolia({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setIsDarkMode(true)
    } else {
      setIsDarkMode(false)
    }
  }, [resolvedTheme])

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        theme={isDarkMode ? darkTheme() : undefined}
        avatar={WalletCustomAvatar}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default WalletProviderSepolia
