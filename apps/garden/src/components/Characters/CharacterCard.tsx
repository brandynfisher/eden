import { Character } from '@edenlabs/eden-sdk'
import { Card, Image } from 'antd'

const CharacterCard = ({ character }: { character: Character }) => {
  return (
    <Card key={character.id} hoverable>
      <div>
        <Image src={''} alt={`${character.name}'s Avatar`} preview={false} />
      </div>
      <div>
        <div className="font-bold">{character.name}</div>
        <div className="text-gray-400 line-clamp-2">
          {character.description}
        </div>
      </div>
    </Card>
  )
}

export default CharacterCard
