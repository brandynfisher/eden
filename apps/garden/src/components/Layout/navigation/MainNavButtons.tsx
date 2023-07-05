import { HomeOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

type NavButtonItem = { text: string; path: string; icon: React.ReactNode }

const NavButton = ({
  text,
  path,
  isActive,
  icon,
}: {
  text: string
  path: string
  isActive?: boolean
  icon?: ReactNode
}) => {
  return (
    <Link href={path} className="mr-2 last:mr-0 flex" passHref>
      <Button
        type="text"
        className={`text-black dark:text-gray-300 ${
          isActive ? 'bg-gray-300 dark:bg-gray-800' : 'bg-none dark:bg-gray-900'
        } hover:text-gray-100`}
      >
        <div className="flex">
          {icon && <div className="mr-2">{icon}</div>}
          <div>{text}</div>
        </div>
      </Button>
    </Link>
  )
}

const MainNavButtons = () => {
  const router = useRouter()
  // const [bookmarkCollectionPath, setBookmarkCollectionPath] = useState('')

  // const { collections } = useContext(UserContext)

  // useEffect(() => {
  //   if (collections?.length) {
  //     setBookmarkCollectionPath(`/collections/${collections[0]._id}`)
  //   }
  // }, [collections])

  const navItems: NavButtonItem[] = [
    { text: 'Creations', icon: <HomeOutlined />, path: '/' },
    // {
    //   text: 'Collections',
    //   icon: <TableOutlined />,
    //   path: bookmarkCollectionPath,
    // },
  ]

  return (
    <>
      {navItems.map(item => (
        <NavButton
          key={item.path}
          isActive={router.pathname === item.path}
          text={item.text}
          path={item.path}
          icon={item.icon}
        />
      ))}
    </>
  )
}

export default MainNavButtons
