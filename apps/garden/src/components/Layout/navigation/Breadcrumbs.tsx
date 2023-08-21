import Link from 'next/link'
import { ReactElement } from 'react'

export type BreadcrumbItem = {
  path?: string
  title?: string
  icon?: ReactElement
  subItems?: BreadcrumbItem[]
}

const BreadcrumbItemContent = ({ item }: { item: BreadcrumbItem }) => {
  return (
    <>
      {item.icon ? item.icon : null}
      {item.title ? <span>{item.title}</span> : null}
    </>
  )
}

const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <div className="flex mb-4">
      {items &&
        items.map((item, index) => {
          const isLastItem = !(index + 1 < items.length)

          return (
            <div key={`${item.path}_${index}`} className="flex gap-2">
              {item.path && !isLastItem ? (
                <>
                  <Link href={item.path} className="flex gap-2 items-center">
                    <BreadcrumbItemContent item={item} />
                  </Link>
                  <div className="mr-2 text-gray-500">{'/'}</div>
                </>
              ) : (
                <>
                  <div className="flex gap-2 items-center">
                    <BreadcrumbItemContent item={item} />
                  </div>
                </>
              )}
            </div>
          )
        })}
    </div>
  )
}

export default Breadcrumbs
