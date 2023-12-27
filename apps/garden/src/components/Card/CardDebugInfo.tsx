import { CardData } from '@/components/Card/Card'
import React from 'react'

type ExtendedCardData = CardData & {
  embedding?: {
    score?: number
    score_age_decay?: number
    score_adjusted?: number
    score_age_hours?: number
  }
  attributes?: {
    nsfw_score?: number
  }
}

const CardDebugInfo = ({ data }: { data: CardData }) => {
  const item = data as ExtendedCardData

  return (
    <div>
      <div className="flex justify-between gap-2 text-xs">
        <div>score</div>
        <div>{item.embedding?.score?.toFixed(3)}</div>
      </div>
      <div className="flex justify-between gap-2 text-xs">
        <div>score_age_hours</div>
        <div>{item.embedding?.score_age_hours}</div>
      </div>
      <div className="flex justify-between gap-2 text-xs">
        <div>score_age_decay</div>
        <div>{item.embedding?.score_age_decay?.toFixed(3)}</div>
      </div>
      <div className="font-bold flex justify-between gap-2 text-xs">
        <div>score_adjusted</div>
        <div>{item.embedding?.score_adjusted?.toFixed(3)}</div>
      </div>
      <div className="flex justify-between gap-2 text-xs text-gray-500">
        <div>nsfw_score</div>
        <div>
          {item.attributes && item.attributes.nsfw_score
            ? item.attributes.nsfw_score.toFixed(3)
            : 'n/a'}
        </div>
      </div>
    </div>
  )
}

export default CardDebugInfo
