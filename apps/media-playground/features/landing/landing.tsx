import LinkCard from '@/components/card/link-card'
import EdenLogoTall from '@/components/logo/eden-logo-tall'

const Landing = () => {
  return (
    <div className="flex flex-col gap-8 justify-between items-center flex-grow">
      <EdenLogoTall />

      <div className="mb-0 grid sm:grid-cols-2 gap-4 lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left">
        <LinkCard
          href={'/create'}
          title={'Create'}
          text={'Start creating with Eden'}
        />
        <LinkCard
          href={'/train'}
          title={'Train Models'}
          text={'Train custom models'}
        />
        <LinkCard
          href={'/creations'}
          title={'Explore'}
          text={'Browse creations'}
        />
      </div>
    </div>
  )
}

export default Landing
