import { Capability } from '@eden-labs/eden-sdk/dist/responses/AgentsGetResponse'
import { Button, Card } from 'antd'
// import { useRouter } from 'next/router'
import React from 'react'

import { handleAxiosError } from '../../../lib/fetcher'

const CapabilityCard = ({
  capability,
  mutateCapabilities,
}: {
  capability: Capability
  mutateCapabilities: VoidFunction
}) => {
  // const router = useRouter()
  // const characterId = router.query.id as string
  const handleDeleteCapability = async () => {
    try {
      // await axios.delete(`/api/capabilities/${capability._id}`)
      mutateCapabilities()
    } catch (error) {
      handleAxiosError(error, 'Failed to delete capability')
    }
  }

  return (
    <>
      <Card className="font-mono">
        {capability.name}
        <Button
          className="font-mono"
          danger
          onClick={handleDeleteCapability}
          style={{ float: 'right' }}
        >
          Delete
        </Button>
        <Button
          className="font-mono bg-black text-white"
          // onClick={() =>
          //   router.push(
          //     `/characters/${characterId}/capabilities/${capability._id}`,
          //   )
          // }
          style={{ float: 'right' }}
        >
          Edit
        </Button>
      </Card>
    </>
  )
}

export default CapabilityCard
