import LinkCard from '@/components/card/link-card'
import Image from 'next/image'

const Landing = () => {
  return (
    <div className="flex flex-col gap-8 justify-between items-center flex-grow">
      <div className="relative flex flex-grow items-center invert dark:invert-0">
        <Image
          src={'/eden-logo-text-tall-mono.png'}
          alt={'Logo'}
          width={640}
          height={765}
          // fill={true}
          className="h-[192px] md:h-[300px] w-auto"
        />
      </div>

      <div className="mb-0 grid sm:grid-cols-2 gap-4 lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left">
        <LinkCard
          href={'/create'}
          title={'Create'}
          text={'Start creating with Eden'}
        />
        <LinkCard
          href={'/train/lora_trainer'}
          title={'Train'}
          text={'Train custom models'}
        />
        <LinkCard
          href={'/explore'}
          title={'Explore'}
          text={'Browse creations'}
        />
      </div>
    </div>
  )
}

export default Landing
