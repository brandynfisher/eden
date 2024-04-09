import TextInlineEditable from '@/components/Forms/TextInlineEditable'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { Concept } from '@edenlabs/eden-sdk'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const ConceptDescription = ({
  concept,
  editable,
  onChange,
}: {
  concept: Concept
  editable: boolean
  onChange: (updatedConcept: Concept) => void
}) => {
  const { message } = App.useApp()
  const { maybeAuthenticate } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false)

  const handleEditDescriptionClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
  }

  const handleDescriptionSubmit = async (updatedText: string) => {
    await axios.patch(`/api/concepts/${concept._id}`, {
      update: {
        description: updatedText,
      },
    })

    onChange({
      ...concept,
      description: updatedText,
    })

    message.destroy()
    message.success(`Concept description changed`)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <div
        className={`dark:text-white min-w-0 ${isEditing ? 'w-full' : ''}`}
        title={concept?.description}
      >
        {!isEditing ? (
          <>
            {concept?.description ? (
              <TruncatedExpandableText text={concept?.description} lines={3} />
            ) : (
              <>
                {editable ? (
                  <div className="text-gray-500 text-xs">Add a description</div>
                ) : null}
              </>
            )}
          </>
        ) : (
          <TextInlineEditable
            minLength={0}
            maxLength={1000}
            text={concept?.description || ''}
            placeholder={'Enter new description'}
            onEditStop={() => setIsEditing(false)}
            onSubmit={handleDescriptionSubmit}
          />
        )}
      </div>

      {editable && (
        <>
          {!isEditing && (
            <Button
              size={'small'}
              type="text"
              onClick={() => handleEditDescriptionClick()}
            >
              <EditOutlined className="text-xl" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default ConceptDescription
