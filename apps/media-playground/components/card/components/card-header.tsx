type Props = {
  title?: string
}
const CardHeader = ({ title }: Props) => {
  return (
    <div className="bg-muted text-muted-foreground p-1">
      <div className="h-6 md:h-9 flex justify-between items-center">
        {title}
      </div>
    </div>
  )
}

export default CardHeader
