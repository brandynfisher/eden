import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  title?: string
  text: string
}

const CopyTextButton = ({ title, text }: Props) => {
  const [copiedText, copy] = useCopyToClipboard()
  const handleCopyString = (text: string, title?: string) => () => {
    copy(text)
      .then(() => {
        toast.success(`Copied ${title ? `"${title}"` : 'value'}`, {
          description:
            text && text.length > 120 ? `${text.substring(0, 120)}...` : text,
          dismissible: true,
          richColors: true,
        })
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast.error(`Failed to copy!`, {
          description: error,
          dismissible: true,
          richColors: true,
        })
      })
  }

  return (
    <Button
      title="Copy"
      size="sm"
      variant="ghost"
      onClick={handleCopyString(text, title)}
    >
      <CopyIcon className="h-3 w-3" />
    </Button>
  )
}

export default CopyTextButton
