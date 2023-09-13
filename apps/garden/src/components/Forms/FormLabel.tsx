const FormLabel = ({
  text,
  description,
}: {
  text: string
  description?: string
}) => {
  return (
    <div className={`${description ? 'mb-1' : ''}`}>
      <div className={`${description ? 'mb-1' : ''} font-mono`}>{text}</div>
      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  )
}

export default FormLabel
