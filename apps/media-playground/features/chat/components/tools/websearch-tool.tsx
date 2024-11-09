import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { makeAssistantToolUI } from '@assistant-ui/react'

type WebSearchToolArgs = {
  query: string
}

type WebSearchToolResult = {
  title: string
  description: string
  url: string
}

export const WebsearchTool = makeAssistantToolUI<WebSearchToolArgs, string>({
  toolName: 'web_search',
  render: ({ argsText, status, result }) => {
    const resultObj = result
      ? (JSON.parse(result) as WebSearchToolResult)
      : undefined

    return (
      <div>
        <div className="bg-muted rounded-md px-2">
          tool:
          <pre className="whitespace-pre-wrap">
            web_search({argsText}) | status: {JSON.stringify(status)}
          </pre>
        </div>

        {resultObj ? (
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Web Search Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold">{resultObj.title}</div>
              <div className="text-sm">{resultObj.description}</div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" asChild>
                <a
                  href={resultObj.url}
                  target="_blank"
                  rel={'noreferrer noopener nofollow'}
                >
                  Visit: {resultObj.url}
                </a>
              </Button>
            </CardFooter>
          </Card>
        ) : null}
      </div>
    )
  },
})
