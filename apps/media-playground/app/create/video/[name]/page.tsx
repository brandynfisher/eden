import TypographyH3 from '@/components/ui/typography/TypographyH3'

type Props = {
  params: {
    name: string
  }
}

const CreateVideoPage = ({ params }: Props) => {
  const { name } = params

  return (
    <>
      <TypographyH3>
        create - video - {name}
      </TypographyH3>
      <div>
        creation video tools
      </div>
    </>
  )
}

export default CreateVideoPage
