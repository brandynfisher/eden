import { AvatarComponent } from '@rainbow-me/rainbowkit'
import Blockies from 'react-blockies'

const WalletCustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <img
      alt={'ensImage'}
      src={ensImage}
      width={size}
      height={size}
      style={{ borderRadius: 999 }}
    />
  ) : (
    <Blockies seed={address} />
  )
}

export default WalletCustomAvatar
