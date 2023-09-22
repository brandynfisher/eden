import { Session } from '@edenlabs/eden-sdk'
import { Empty } from 'antd'
import Link from 'next/link'
import React from 'react'

const SessionsGrid = ({ sessions }: { sessions: Session[] }) => {
  {
    /* @todo: re-enable by removing "hidden" when sessions is ready */
  }
  return (
    <div className="mb-8 hidden">
      <h2 className="mb-4">Previous Sessions</h2>
      {sessions && sessions.length ? (
        <>
          <div className="flex gap-4 flex-wrap">
            {sessions.map(session => (
              <Link key={session.id} href={`/scenarios/chat/${session.id}`}>
                <div>
                  <div>{session.id}</div>
                  <div>{session.type}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col items-center">
              <div className="mb-4">Nothing here yet.</div>
            </div>
          }
        />
      )}
    </div>
  )
}

export default SessionsGrid
