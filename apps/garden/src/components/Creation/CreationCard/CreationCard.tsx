import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CreationCardHoverOverlay from '@/components/Creation/CreationCard/CreationCardHoverOverlay'
import CreationCardPreview from '@/components/Creation/CreationCard/CreationCardPreview'
import CreationDetailModal from '@/components/Creation/CreationCard/CreationDetailModal'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { NextRouter, useRouter } from 'next/router'
import React from 'react'

interface ISpecialRouteIndex<TValue> {
  [id: string]: TValue
}

const specialHandlingRoutes: ISpecialRouteIndex<{ basePath: string }> = {
  '/creators/[id]': {
    basePath: 'creators',
  },
  '/collections/[id]': {
    basePath: 'collections',
  },
}

const getModalUrls = (
  router: NextRouter,
  creationId: string,
): { pageUrl: string; modalUrl: string } => {
  const urls = {
    pageUrl: '',
    modalUrl: '',
  }

  // all default cases
  if (!specialHandlingRoutes[router.pathname]) {
    urls.modalUrl = `/creations/${creationId}`
    return urls
  }

  // special workaround when we're trying to open modals on routes with dynamic parameters
  const basePath = specialHandlingRoutes[router.pathname].basePath
  urls.modalUrl = `/${basePath}/${router.query.id}?creationId=${creationId}`
  urls.pageUrl = urls.modalUrl

  return urls
}

const CreationCard = ({ index, data }: { index: number; data: Creation }) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [creation, setCreation] = React.useState(data)
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
    React.useState(false)

  const { pageUrl, modalUrl } = getModalUrls(router, creation._id)

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    setDetailModalOpen(true)
  }

  return (
    <div>
      <div className="relative " key={index}>
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative rounded-lg overflow-hidden cursor-pointer "
          >
            <CreationCardPreview creation={creation} hovered={hovered} />
            {hovered && (
              <CreationCardHoverOverlay
                creation={creation}
                handlers={{ onChange: setCreation, openDetailModal }}
              />
            )}
          </div>
        </div>
      </div>
      {detailModalOpen && (
        <CreationDetailModal
          modalUrl={modalUrl}
          setDetailModalOpen={setDetailModalOpen}
          creation={creation}
        />
      )}
      <AddToCollectionModal
        open={addToCollectionModalOpen}
        setOpen={setAddToCollectionModalOpen}
        creation={creation}
      />
    </div>
  )
}

export default CreationCard
