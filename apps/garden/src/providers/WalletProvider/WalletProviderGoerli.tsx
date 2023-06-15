import { CONFIG } from '@/lib/config'
import { ParticleNetwork } from '@particle-network/auth'
import { particleWallet } from '@particle-network/rainbowkit-ext'
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
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
import { PropsWithChildren } from 'react'
import { WagmiConfig, configureChains, createConfig, sepolia } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'

new ParticleNetwork({
  projectId: CONFIG.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
  clientKey: CONFIG.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
  appId: CONFIG.NEXT_PUBLIC_PARTICLE_APP_ID,
  chainId: sepolia.id,
  chainName: 'ethereum',
})

const { chains, publicClient } = configureChains(
  [sepolia],
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
    rainbowWallet({ chains }),
    coinbaseWallet({ appName: 'RainbowKit demo', chains }),
    metaMaskWallet({ chains }),
    walletConnectWallet({ chains }),
  ],
}

const connectors = connectorsForWallets([
  popularWallets,
  {
    groupName: 'Other',
    wallets: [
      argentWallet({ chains }),
      trustWallet({ chains }),
      omniWallet({ chains }),
      imTokenWallet({ chains }),
      ledgerWallet({ chains }),
    ],
  },
])

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

function WalletProviderGoerli({ children }: PropsWithChildren) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
    </WagmiConfig>
  )
}

export default WalletProviderGoerli
