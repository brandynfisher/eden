import TimelineConcept from '@/components/Creation/CreationInterface/Timeline/TimelineConcept'
import TimelineCreationSample from '@/components/Creation/CreationInterface/Timeline/TimelineCreationSample'
import { conceptGenerator } from '@/lib/generator'
import { Task } from '@edenlabs/eden-sdk'
import React from 'react'

const TimelineItemMedia = ({
  task,
  listIndex,
}: {
  task: Task
  listIndex?: number
}) => {
  if (task.generator.generatorName === conceptGenerator.name && task.concept) {
    return (
      <TimelineConcept
        task={task}
        conceptId={task.concept}
        listIndex={listIndex || 0}
      />
    )
  }

  return (
    <>
      {task.samples && task.samples.length ? (
        <div className={`grid grid-cols-2 gap-2`}>
          {task.samples.map(id => (
            <TimelineCreationSample
              key={id}
              task={task}
              creationId={id}
              listIndex={listIndex || 0}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1">
          <TimelineCreationSample
            task={task}
            creationId={task.creation ? task.creation._id : task.creation}
            listIndex={listIndex || 0}
          />
        </div>
      )}
    </>
  )
}

export default TimelineItemMedia
