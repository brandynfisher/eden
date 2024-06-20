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
          href={'/sandbox/media'}
          title={'Media'}
          text={'Testbed for Streaming, CDN, Scaling'}
        />
        <LinkCard
          href={'/sandbox/masonry'}
          title={'Masonry'}
          text={'Experiments for infinite masonry layouts'}
        />
        <LinkCard
          href={'/sandbox/react-query'}
          title={'React Query'}
          text={'Sandbox for ReactQuery'}
        />
        <LinkCard
          href={'/sandbox/graphql'}
          title={'Apollo'}
          text={'Sandbox for Apollo/GraphQL'}
        />
      </div>
    </div>
  )
}

export default Landing
