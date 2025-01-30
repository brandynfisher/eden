import { ReactNode } from 'react'

interface TrainingFeatureCardProps {
  icon?: ReactNode
  title?: ReactNode
  content?: ReactNode
}

export default function TrainingFeatureCard({
  icon,
  title,
  content,
}: TrainingFeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
      {icon && <div className="mb-2">{icon}</div>}
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      {content && (
        <div className="text-sm text-muted-foreground text-center flex flex-col items-center">
          {content}
        </div>
      )}
    </div>
  )
}
