import { EllipsisIcon } from 'lucide-react'

const ToolsButton = () => {
  return (
    <div className="flex group items-center justify-center cursor-pointer w-8 h-8">
      <EllipsisIcon className="group-hover:text-primary" size={20} />
    </div>
  )
}

export default ToolsButton
