import LinkCard from '@/components/card/link-card'
import RotatingEdenLogo from '@/components/logo/rotating-eden-logo'

const Landing = () => {
  return (
    <div className="flex flex-col gap-8 justify-between items-center flex-grow">
      <div className="flex flex-grow items-center">
        <RotatingEdenLogo variant={'large'} />
      </div>

      <div className="mb-0 grid md:grid-cols-2 gap-4 lg:max-w-5xl lg:w-full lg:grid-cols-4 lg:text-left">
        <LinkCard
          href={'/sandbox/masonry'}
          title={'Masonry'}
          text={'Experiments for infinite masonry layouts'}
        />
      </div>
    </div>
  )
}

export default Landing
