import { Button, Space, Table } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React from 'react'

import { useCharacters } from '../hooks/useCharacters'
import { handleAxiosError } from '../lib/fetcher'
import { CharacterDocument } from '../models/Character'

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
  const router = useRouter()
  const { mutate } = useCharacters()
  const handleDeleteCharacter = async () => {
    try {
      await axios.delete(`/api/characters/${characterId}`)
      mutate()
    } catch (error) {
      handleAxiosError(error)
    }
  }

  const handleViewCharacter = () => {
    router.push(`/characters/${characterId}`)
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

const CharacterTable = ({
  characters,
}: {
  characters: CharacterDocument[] | undefined
}) => {
  const data =
    characters &&
    characters.map((character: CharacterDocument) => {
      return {
        key: character._id,
        name: character.name,
        deployments: character.deployments.length,
        actions: <ActionsButtons characterId={character._id} />,
      }
    })

  return (
    <>
      <Table columns={columns} dataSource={data} pagination={false} />
    </>
  )
}

export default CharacterTable
