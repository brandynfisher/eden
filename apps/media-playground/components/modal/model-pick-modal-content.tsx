import ModelsFeed from '@/features/feed/models-feed'

type Props = {
  currentValue: string
  onChange: (id: string) => void
}

const ModelPickModalContent = ({ currentValue, onChange }: Props) => {
  return (
    <div>
      <div className="mb-4">
        <div className="bg-muted rounded-lg p-2">
          current value: {JSON.stringify(currentValue)}
        </div>
      </div>
      <ModelsFeed minCols={1} maxCols={4} onClick={onChange} />
    </div>
  )
}

export default ModelPickModalContent
