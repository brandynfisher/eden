import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { App, Button, Space, Table } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Deployments',
    dataIndex: 'deployments',
    key: 'deployments',
  },
  {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
  },
]

const ActionsButtons = ({ characterId }: { characterId: string }) => {
  const { message } = App.useApp()
  const router = useRouter()
  const { refetch } = useContext(UserContext)

  const handleDeleteCharacter = async () => {
    try {
      await axios.post(`/api/characters/delete`, {
        characterId: characterId,
      })
      refetch.characters()
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  const handleViewCharacter = async () => {
    await router.push(`/characters/${characterId}`)
  }

  return (
    <Space>
      <Button
        className="font-mono bg-black text-white"
        onClick={handleViewCharacter}
      >
        Edit
      </Button>
      <Button className="font-mono" danger onClick={handleDeleteCharacter}>
        Delete
      </Button>
    </Space>
  )
}

const CharacterTable = () => {
  const { characters } = useContext(UserContext)

  const data =
    characters &&
    characters.map((character: Character) => {
      return {
        key: character.id,
        name: character.name,
        actions: <ActionsButtons characterId={character.id} />,
      }
    })

  return (
    <>
      <Table columns={columns} dataSource={data} pagination={false} />
    </>
  )
}

export default CharacterTable
