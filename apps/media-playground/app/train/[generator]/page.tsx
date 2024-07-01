import TypographyH3 from '@/components/ui/typography/TypographyH3'

type Props = {
  params: {
    generator: string
  }
}

const TrainGeneratorPage = ({ params }: Props) => {
  const { generator } = params

  return (
    <div>
      <TypographyH3>train - {generator}</TypographyH3>
      <div>training tools</div>
    </div>
  )
}

export default TrainGeneratorPage
