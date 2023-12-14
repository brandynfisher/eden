import CardReactions from '@/components/Card/CardReactions'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import ConceptCreations from '@/components/Concept/ConceptDetail/ConceptCreations'
import ConceptInfo from '@/components/Concept/ConceptDetail/ConceptInfo'
import ConceptMedia from '@/components/Concept/ConceptDetail/ConceptMedia'
import CreationInfo from '@/components/Creation/CreationDetail/CreationInfo'
import CreationMedia from '@/components/Creation/CreationDetail/CreationMedia'
import CreationSamples from '@/components/Creation/CreationDetail/CreationSamples'
// import SimilarCreations from '@/components/Creation/CreationDetail/SimilarCreations'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import CreatorSection from '@/components/Detail/CreatorSection'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { isImageUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Divider } from 'antd'
import Head from 'next/head'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'

const getItemMediaUrl = (itemType: ItemType, item: Creation | Concept) => {
  if (itemType === 'creation') {
    return item.uri
  }

  return item.thumbnail || ''
}

const Details = ({
  item,
  itemType,
  isModal,
  modalContainerRef,
  modalContainerHeight,
}: // loadSimilar,
{
  item: Creation | Concept
  itemType: ItemType
  isModal?: boolean
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  // loadSimilar?: boolean
}) => {
  const [itemData, setItemData] = useState<Creation | Concept>(item)
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

  return (
    <>
      <Head>
        <title>{`/${itemType} by ${item?.user?.username} | Garden of Eden`}</title>
        {/*{itemType === 'creation' && isVideoUrl(item.uri) &&  (*/}
        {/*  <>*/}
        {/*    <meta property='og:type' content='video.other' />*/}
        {/*    <meta*/}
        {/*      property='og:video:duration'*/}
        {/*      content={String(item.mediaAttributes.duration)}*/}
        {/*    />*/}
        {/*  </>*/}
        {/*)}*/}
        <meta
          property="og:title"
          key="title"
          content={`/${itemType} by ${item?.user?.username} | Garden of Eden`}
        />
        <meta property="og:description" content={item.name} key="description" />
        <meta property="og:image" content={item.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={item.thumbnail} />
        <meta
          property="og:image:alt"
          content={`/${itemType} by ${item?.user?.username} | Garden of Eden`}
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
        />
      </Head>

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
                isImageUrl(getItemMediaUrl(itemType, item))
                  ? () => handlePreviewClick(getItemMediaUrl(itemType, item))
                  : () => false
              }
              className="relative flex justify-center flex-grow max-h-[80vh] overflow-hidden"
            >
              {itemType === 'creation' ? (
                <CreationMedia creation={item as Creation} />
              ) : (
                <ConceptMedia concept={item as Concept} />
              )}
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
                onChange={
                  setItemData as Dispatch<SetStateAction<Concept | Creation>>
                }
                showCounts={true}
              />
              {itemData ? (
                <CardToolsDropdown
                  item={itemData}
                  itemType={itemType}
                  onChange={
                    setItemData as Dispatch<SetStateAction<Concept | Creation>>
                  }
                />
              ) : null}
            </div>

            <CreatorSection
              user={itemData.user}
              showFollowControls={showFollowControls}
            />

            <div className="relative mb-2 col-span-8 p-2 pt-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
              <div className="flex gap-2 items-center justify-between">
                <TruncatedExpandableText text={item?.name} />
                {itemType === 'concept' ? (
                  <div className="flex gap-2">
                    <ConceptCardFooter concept={item as Concept} />
                  </div>
                ) : null}
              </div>
              <Divider className="my-4" />
              {itemType === 'creation' ? (
                <CreationInfo creation={item as Creation} />
              ) : (
                <ConceptInfo concept={item as Concept} />
              )}
            </div>
            {itemType === 'creation' ? (
              <CreationSamples creation={item as Creation} />
            ) : null}
          </div>
        </div>
        {/*{loadSimilar ? (*/}
        {/*  <SimilarCreations*/}
        {/*    creation={creation}*/}
        {/*    containerRef={containerRef}*/}
        {/*    isModal={isModal}*/}
        {/*  />*/}
        {/*) : null}*/}
      </div>
      {itemType === 'concept' ? (
        <div className={`${isModal ? 'px-2 md:px-0' : ''} md:mt-2`}>
          <ConceptCreations
            concept={item as Concept}
            modalContainerRef={modalContainerRef}
            modalContainerHeight={modalContainerHeight}
          />
        </div>
      ) : null}
    </>
  )
}

export default Details
