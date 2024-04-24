import TypographyH3 from '@/components/ui/typography/TypographyH3'
import GeneratorList from '@/components/generator-list'

const ReactQuerySandboxPage = () => {
  return (
    <div>
      <TypographyH3>
        sandbox: react-query
      </TypographyH3>
      <div className="mt-4">
        <div>tools</div>
        <GeneratorList />
      </div>
    </div>
  )
}

export default ReactQuerySandboxPage
