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
        className="flex items-center gap-2 w-full justify-between"
        title={'Opens page in new tab'}
        href={url}
        target="_blank"
      >
        <div>{label}</div>
        <OpenInNewIcon fontSize="small" />
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
