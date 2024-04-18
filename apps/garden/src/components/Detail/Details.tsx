import CharacterInfo from '../Characters/CharacterInfo'
import { CardData } from '@/components/Card/Card'
import CardDebugInfo from '@/components/Card/CardDebugInfo'
import CardReactions from '@/components/Card/CardReactions'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import ConceptInfo from '@/components/Concept/ConceptDetail/ConceptInfo'
import ConceptMedia from '@/components/Concept/ConceptDetail/ConceptMedia'
import CreationInfo from '@/components/Creation/CreationDetail/CreationInfo'
import CreationMedia from '@/components/Creation/CreationDetail/CreationMedia'
import CreationSamples from '@/components/Creation/CreationDetail/CreationSamples'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import CreatorSection from '@/components/Detail/CreatorSection'
import { getItemMediaUrl } from '@/components/HeadTags'
import ModalMasonry from '@/components/Masonry/ModalMasonry'
import MediaDisplay from '@/components/MediaDisplay'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { getId } from '@/lib/modal'
import { isImageUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Character, Concept, Creation } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Divider } from 'antd'
import { useRouter } from 'next/router'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'

const Details = ({
  item,
  itemType,
  isModal,
  modalContainerRef,
  modalContainerHeight,
}: {
  item: CardData
  itemType: ItemType
  isModal?: boolean
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const [itemData, setItemData] = useState<CardData>(item)
  const [showFollowControls, setShowFollowControls] = useState(false)
  const [zoomedInImageUrl, setZoomedInImageUrl] = useState<null | string>(null)

  const { isAuthenticated, user, userId } = useContext(UserContext)

  useEffect(() => {
    if (isAuthenticated && user?.userId === userId) {
      setShowFollowControls(true)
    } else {
      setShowFollowControls(false)
    }
  }, [isAuthenticated, user?.userId, userId])

  useEffect(() => {
    setItemData(item)
  }, [item])

  const hideMediaViewer = () => {
    setZoomedInImageUrl(null)
  }

  const handlePreviewClick = (url: string | undefined) => {
    if (!url) {
      setZoomedInImageUrl(null)
      return
    }

    setZoomedInImageUrl(url)
  }

  const router = useRouter()
  const [debugMode, setDebugMode] = useState<boolean>(false)
  useEffect(() => {
    setDebugMode(!!(router.query && router.query.debug))
  }, [router.query])

  return (
    <>
      {zoomedInImageUrl && (
        <ImageZoomPan
          imageUrl={zoomedInImageUrl}
          onCloseHandler={hideMediaViewer}
        />
      )}

      <div data-testid="creation-detail">
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div
            className={`relative ${
              isModal ? 'px-2' : ''
            } md:px-0 mx-auto mb-2 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-col xl:min-w-[320px]`}
          >
            <div
              onClick={
                itemType === 'character'
                  ? () => handlePreviewClick((item as Character).image)
                  : isImageUrl(
                      getItemMediaUrl(itemType, item as Creation | Concept),
                    )
                  ? () =>
                      handlePreviewClick(
                        getItemMediaUrl(itemType, item as Creation | Concept),
                      )
                  : () => false
              }
              className="relative flex justify-center flex-grow max-h-[80vh] overflow-hidden"
            >
              {itemType === 'creation' ? (
                <CreationMedia creation={item as Creation} />
              ) : null}
              {itemType === 'concept' ? (
                <ConceptMedia concept={item as Concept} />
              ) : null}
              {itemType === 'character' ? (
                <MediaDisplay
                  priority={true}
                  aspectRatio={100}
                  className={'media-display__main'}
                  creationUri={
                    (item as Character).image
                      ? (item as Character).image || ''
                      : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                  }
                  previewUri={(item as Character)?.image}
                />
              ) : null}
              {itemData.isPrivate ? (
                <div
                  className={`flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none`}
                >
                  <LockIcon fontSize="small" className="text-white" />
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={`${
              isModal ? 'px-2  md:px-0' : ''
            } lg:mx-0 xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]`}
          >
            <div className="flex items-center h-10 px-2 mb-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between">
              <CardReactions
                itemType={itemType}
                item={itemData}
                onChange={setItemData as Dispatch<SetStateAction<CardData>>}
                showCounts={true}
              />
              {itemData ? (
                <CardToolsDropdown
                  item={itemData}
                  itemType={itemType}
                  onChange={updatedItem => setItemData(updatedItem as CardData)}
                  pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${getId(
                    itemType,
                    item,
                  )}`}
                />
              ) : null}
            </div>

            <CreatorSection
              user={itemData.user}
              showFollowControls={showFollowControls}
            />

            <div className="relative mb-2 col-span-8 p-2 pt-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
              <div className="flex gap-2 items-center justify-between">
                {itemType === 'creation' ? (
                  <>
                    {(item as Creation).task.generatorName}
                    {(item as Creation).task.generator.generatorName ===
                    'upscale' ? (
                      'upscale'
                    ) : (
                      <TruncatedExpandableText text={item?.name} lines={3} />
                    )}
                  </>
                ) : (
                  <TruncatedExpandableText
                    text={item?.name}
                    lines={3}
                    hideCopy={true}
                  />
                )}
                {itemType === 'concept' ? (
                  <div className="flex gap-2">
                    <ConceptCardFooter concept={item as Concept} />
                  </div>
                ) : null}
              </div>
              <Divider className="my-4" />
              {itemType === 'creation' ? (
                <CreationInfo creation={item as Creation} />
              ) : null}
              {itemType === 'concept' ? (
                <ConceptInfo
                  concept={itemData as Concept}
                  onUpdate={(updatedConcept: Concept) =>
                    setItemData(updatedConcept)
                  }
                />
              ) : null}
              {itemType === 'character' ? (
                <CharacterInfo character={item as Character} />
              ) : null}
            </div>
            {itemType === 'creation' ? (
              <>
                {debugMode ? <CardDebugInfo data={item} /> : null}
                <CreationSamples creation={item as Creation} />
              </>
            ) : null}
          </div>
        </div>
      </div>
      {itemType === 'concept' ? (
        <div className={`${isModal ? 'px-2 md:px-0' : ''} md:mt-2`}>
          <ModalMasonry
            key={`conceptId_${item._id}`}
            itemType="creation"
            masonryKeySuffix={`conceptId_${item._id}`}
            title="Latest Public Creations"
            query={{ conceptId: item._id }}
            modalContainerRef={modalContainerRef}
            modalContainerHeight={modalContainerHeight}
            hasFeedFilter={false}
          />
        </div>
      ) : null}
      {itemType === 'creation' ? (
        <div className={`${isModal ? 'px-2 md:px-0' : ''} md:mt-2`}>
          <ModalMasonry
            key={`creationId_${item._id}`}
            itemType="creation"
            masonryKeySuffix={`creationId_${item._id}`}
            title="Similar Creations"
            query={{ creationId: item._id }}
            modalContainerRef={modalContainerRef}
            modalContainerHeight={modalContainerHeight}
            hasFeedFilter={false}
          />
        </div>
      ) : null}
    </>
  )
}

export default Details
