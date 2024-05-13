import TypographyH3 from '@/components/ui/typography/TypographyH3'

type Props = {
  params: {
    name: string
  }
}

const CreateImagePage = ({ params }: Props) => {
  const { name } = params

  return (
    <>
      <TypographyH3>
        create - image - {name}
      </TypographyH3>
      <div>
        creation image tools
      </div>
    </>
  )
}

export default CreateImagePage
