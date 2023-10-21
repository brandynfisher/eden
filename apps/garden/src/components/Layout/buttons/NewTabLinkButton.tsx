import CircleButton from '@/components/Layout/buttons/CircleButton'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Link from 'next/link'

const NewTabLinkButton = ({
  url,
  variant,
  label,
}: {
  url: string
  variant?: 'text'
  label?: string
}) => {
  if (variant === 'text') {
    return (
      <Link
        className="p-2 w-full h-full"
        title={'Opens page in new tab'}
        href={url}
        target="_blank"
      >
        <div className="flex items-center gap-2 w-full justify-between">
          <div>{label}</div>
          <OpenInNewIcon fontSize="small" />
        </div>
      </Link>
    )
  }

  return (
    <Link href={url} target="_blank">
      <CircleButton
        title={'Opens page in new tab'}
        icon={<OpenInNewIcon fontSize="medium" />}
      />
    </Link>
  )
}

export default NewTabLinkButton
