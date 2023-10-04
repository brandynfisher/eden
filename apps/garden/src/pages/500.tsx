import { Button } from 'antd'
import Link from 'next/link'

export default function Custom500() {
  return (
    <section className="block">
      <div className="px-5 md:px-10">
        <div className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex-col flex w-full max-w-3xl items-center">
            <img
              src="/placeholder.png"
              alt=""
              className="mb-8 mx-auto inline-block h-48 w-48 max-w-full flex-none object-cover"
            />
            <div className="text-center">
              <h2 className="font-bold mb-4 text-2xl md:text-4xl">
                500 - Server Error
              </h2>
              <div className="mx-auto max-w-[528px] mb-5 md:mb-6 lg:mb-8">
                <p className="text-[#636262] max-[479px]:text-sm">
                  Oops! 🌿 Looks like our server's gone rogue. You've stumbled
                  into the Orchard of Technical Difficulties 🍎.
                  <br />
                  Don't worry, though; even in the wilds of server issues, your
                  adventurous spirit shines bright.
                  <br />
                  We're working tirelessly to restore the garden to its pristine
                  state.
                </p>
              </div>
              <Link href="/" passHref>
                <Button className="font-mono">Back Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
