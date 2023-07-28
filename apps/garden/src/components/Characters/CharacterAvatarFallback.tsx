import { Character } from '@edenlabs/eden-sdk'

function stringToHslColor(str: string, saturation: number, luminance: number) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const h = hash % 360
  return 'hsl(' + h + ', ' + saturation + '%, ' + luminance + '%)'
}

const CharacterAvatarFallback = ({
  character,
  size,
}: {
  character: Character
  size?: 'small'
}) => {
  const gradientStartColor = stringToHslColor(character.id, 30, 50)
  const gradientEndColor = stringToHslColor(character.id, 50, 80)

  return (
    <div
      className="w-full h-full flex items-center justify-center p-1"
      style={{
        background: `linear-gradient(to bottom right, ${gradientStartColor}, ${gradientEndColor})`,
      }}
    >
      <span className={size === 'small' ? 'text-xs' : 'text-xl'}>
        {character.name.charAt(0)}
        {character.name.charAt(1)}
      </span>
    </div>
  )
}

export default CharacterAvatarFallback
