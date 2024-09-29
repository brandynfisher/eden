type SessionButtonProps = {
  id: string
  name: string
}

const SessionButton = ({ id, name }: SessionButtonProps) => {
  return (
    <div className="text-sm bg-accent-foreground/20 px-2 py-1 text-accent-foreground cursor-pointer hover:bg-accent-foreground/40 rounded-md">
      {name} - {id}
    </div>
  )
}

const SessionsList = () => {
  const sessions = [
    {
      id: '1',
      name: 'New Chat',
    },
  ]

  return (
    <div className="h-full">
      <div className="h-full bg-accent p-4">
        <div>Sessions</div>
        <div className="mt-4">
          {sessions.map(session => (
            <SessionButton
              key={session.id}
              id={session.id}
              name={session.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SessionsList
