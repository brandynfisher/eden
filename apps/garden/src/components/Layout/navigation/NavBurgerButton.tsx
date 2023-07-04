import { Fade as Hamburger } from 'hamburger-react'
import { useEffect, useState } from 'react'

const NavBurgerButton = ({ open }: { open: boolean }) => {
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    if (isOpen !== open) {
      const timer = setTimeout(() => setOpen(open), 125)

      return () => {
        if (timer) {
          clearTimeout(timer)
        }
      }
    } else {
      setOpen(open)
    }
  }, [open, isOpen])

  return <Hamburger toggled={isOpen} />
}

export default NavBurgerButton
