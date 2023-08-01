function stringToHslColor(str: string, saturation: number, luminance: number) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const h = hash % 360
  return 'hsl(' + h + ', ' + saturation + '%, ' + luminance + '%)'
}

const CharacterAvatarFallback = ({
  id,
  name,
  size,
}: {
  id: string
  name: string
  size?: 'small' | 'medium' | 'large' | 'auto' | undefined
}) => {
  const gradientStartColor = stringToHslColor(id, 30, 50)
  const gradientEndColor = stringToHslColor(id, 50, 80)

  return (
    <div
      className="w-full h-full flex items-center justify-center p-1"
      style={{
        background: `linear-gradient(to bottom right, ${gradientStartColor}, ${gradientEndColor})`,
      }}
    >
      <span
        className={`text-gray-900 font-bold pointer-events-none select-none ${
          size === 'small' ? 'text-xs' : ''
        } ${size === 'medium' ? 'text-sm' : ''} ${
          size === 'large' ? 'text-lg' : ''
        }`}
      >
        {name.charAt(0)}
        {name.charAt(1)}
      </span>
    </div>
  )
}

export default CharacterAvatarFallback
