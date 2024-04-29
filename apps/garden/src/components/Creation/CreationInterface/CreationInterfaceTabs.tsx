import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const CreationInterfaceTabs = () => {
  const router = useRouter()
  // console.log({pathname: router.pathname, asPath: router.asPath, basePath: router.basePath})

  const routes = [
    {
      label: 'Creations',
      value: '/create/creations',
      href: '/create/creations',
    },
    {
      label: 'Models',
      value: '/create/concepts',
      href: '/create/concepts',
    },
    {
      label: 'Characters',
      value: '/create/characters',
      href: '/create/characters',
    },
  ]

  return (
    <Tabs value={router.pathname}>
      {routes.map(route => (
        <Tab
          key={route.value}
          label={route.label}
          value={route.value}
          href={route.href}
          component={Link}
        />
      ))}
    </Tabs>
  )
}

export default CreationInterfaceTabs
