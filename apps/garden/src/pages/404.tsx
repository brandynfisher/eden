import { Button } from 'antd'
import Link from 'next/link'

export default function Custom404() {
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
                404 - Page not found
              </h2>
              <div className="mx-auto max-w-[528px] mb-5 md:mb-6 lg:mb-8">
                <p className="text-[#636262] max-[479px]:text-sm">
                  Oops! 🌿 Looks like you're an adventurous spirit. You've
                  wandered off the path and ended up in the Forbidden Orchard 🍎
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
