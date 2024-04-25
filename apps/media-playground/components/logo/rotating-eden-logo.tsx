import { RotatingImage } from '@/components/logo/rotating-image'

type Variant = 'small' | 'large'

const RotatingEdenLogo = ({ variant }: { variant?: Variant }) => {
  return (
    <div
      className={`relative flex items-center justify-center ${
        variant === 'small' ? 'h-[36px] w-[36px]' : 'h-[193px] w-[193px]'
      } `}
    >
      <RotatingImage
        src="/logo-bw.png"
        alt="Eden Logo"
        priority
      />
      <RotatingImage
        src="/logo-bw.png"
        alt="Eden Logo"
        priority
        className="absolute !delay-100"
      />
      <RotatingImage
        src="/logo-bw.png"
        alt="Eden Logo"
        priority
        className="absolute !delay-200"
      />
      <RotatingImage
        src="/logo-bw.png"
        alt="Eden Logo"
        priority
        className="absolute !delay-300"
      />
    </div>
  )
}

export default RotatingEdenLogo
