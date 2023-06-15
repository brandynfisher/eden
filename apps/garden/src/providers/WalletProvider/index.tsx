import WalletProviderSepolia from '@/providers/WalletProvider/WalletProviderGoerli'
import { PropsWithChildren } from 'react'

function WalletProvider({ children }: PropsWithChildren) {
  return <WalletProviderSepolia>{children}</WalletProviderSepolia>
}

export default WalletProvider
