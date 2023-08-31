import { VerticalAlignTopOutlined } from '@ant-design/icons'
import { useWindowScroll } from '@mantine/hooks'

const BackToTopButton = () => {
  const [scroll, scrollTo] = useWindowScroll()

  if (scroll.y < 700) {
    return null
  }

  return (
    <div
      className="dark:bg-gray-700 rounded cursor-pointer !bg-opacity-80"
      onClick={() => scrollTo({ y: 0 })}
    >
      <VerticalAlignTopOutlined className="text-2xl p-1" />
    </div>
  )
}

export default BackToTopButton
