import Image from 'next/image'

const EdenLogoTall = () => {
  return (
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
  )
}

export default EdenLogoTall
