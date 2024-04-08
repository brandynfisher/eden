import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material'
import React, { ReactNode, RefObject } from 'react'

export const HorizontalSwiperNav = ({
  navRef,
  children,
  onClick,
  className,
}: {
  navRef: RefObject<HTMLDivElement>
  children: ReactNode
  onClick: () => void
  className?: string
}) => {
  return (
    <div
      ref={navRef}
      onClick={onClick}
      className={`absolute z-10 h-full w-10 top-0 opacity-100 flex items-center transition-opacity duration-300 cursor-pointer group from-transparent to-white dark:to-black ${
        className ? className : ''
      }`}
    >
      {children}
    </div>
  )
}

export const HorizontalSwiperNavPrev = ({
  navRef,
  onClick,
}: {
  navRef: RefObject<HTMLDivElement>
  onClick: () => void
}) => {
  return (
    <HorizontalSwiperNav
      navRef={navRef}
      onClick={onClick}
      className="left-0 bg-gradient-to-l"
    >
      <ChevronLeftRounded
        fontSize="large"
        className="dark:text-gray-300 group-hover:scale-125 group-hover:dark:text-gray-200"
      />
    </HorizontalSwiperNav>
  )
}

export const HorizontalSwiperNavNext = ({
  navRef,
  onClick,
}: {
  navRef: RefObject<HTMLDivElement>
  onClick: () => void
}) => {
  return (
    <HorizontalSwiperNav
      navRef={navRef}
      onClick={onClick}
      className="right-0 bg-gradient-to-r"
    >
      <ChevronRightRounded
        fontSize="large"
        className="dark:text-gray-300 group-hover:scale-125 group-hover:dark:text-gray-200 !w-12"
      />
    </HorizontalSwiperNav>
  )
}
