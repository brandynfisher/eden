import HelpOutline from '@mui/icons-material/HelpOutline'
import { Popover } from 'antd'

const ParameterLabel = ({
  text,
  description,
}: {
  text: string
  description?: string
}) => {
  return (
    <div className="flex w-full items-center justify-between">
      <div>{text}</div>
      {description ? (
        <Popover
          content={<div>{description}</div>}
          title={text}
          trigger={['click', 'hover']}
        >
          <HelpOutline
            fontSize="small"
            className="text-gray-400 hover:text-blue-400"
          />
        </Popover>
      ) : null}
    </div>
  )
}

export default ParameterLabel
