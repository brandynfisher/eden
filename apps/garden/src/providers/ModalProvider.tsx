import { CardData } from '@/components/Card/Card'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import AddToCollectionModal from '@/components/Modals/AddToCollectionModal'
import ChannelDetailsModal, {
  ChannelSettings,
} from '@/components/Modals/ChannelDetailsModal'
import DetailModal from '@/components/Modals/DetailModal'
import DetailStaticModal from '@/components/Modals/DetailStaticModal'
import FollowersModal from '@/components/Modals/FollowersModal'
import FollowingModal from '@/components/Modals/FollowingModal'
import GeneratorSelectModal from '@/components/Modals/GeneratorSelectModal'
import MannaRefillModal from '@/components/Modals/MannaRefillModal'
import SelectCharacterModal from '@/components/Modals/SelectCharacterModal'
import SelectConceptModal from '@/components/Modals/SelectConceptModal'
import SubscriptionGateModal from '@/components/Modals/SubscriptionGateModal'
import TaskDetailModal from '@/components/Modals/TaskDetailModal'
import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import {
  Character,
  Concept,
  Creation,
  Creator,
  Generator,
  SubscriptionTier,
  Task,
} from '@edenlabs/eden-sdk'
import { ModalProps } from 'antd'
import { useRouter } from 'next/router'
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export enum MODAL_TYPES {
  DETAIL_MODAL = 'DETAIL_MODAL',
  CHANNEL_DETAIL_MODAL = 'CHANNEL_DETAIL_MODAL',
  DETAIL_STATIC_MODAL = 'DETAIL_STATIC_MODAL',
  COLLECTION_ADD_CREATION_MODAL = 'COLLECTION_ADD_CREATION_MODAL',
  CONCEPT_SELECT_MODAL = 'CONCEPT_SELECT_MODAL',
  CHARACTER_SELECT_MODAL = 'CHARACTER_SELECT_MODAL',
  MANNA_REFILL_MODAL = 'MANNA_REFILL_MODAL',
  FOLLOWERS_MODAL = 'FOLLOWERS_MODAL',
  FOLLOWING_MODAL = 'FOLLOWING_MODAL',
  TASK_DETAIL_MODAL = 'TASK_DETAIL_MODAL',
  GENERATOR_SELECT_MODAL = 'GENERATOR_SELECT_MODAL',
  SUBSCRIPTION_GATE_MODAL = 'SUBSCRIPTION_GATE_MODAL',
}

type GenericModalParams = unknown
const MODAL_COMPONENTS: { [key: string]: GenericModalParams } = {
  [MODAL_TYPES.DETAIL_MODAL]: DetailModal,
  [MODAL_TYPES.CHANNEL_DETAIL_MODAL]: ChannelDetailsModal,
  [MODAL_TYPES.DETAIL_STATIC_MODAL]: DetailStaticModal,
  [MODAL_TYPES.COLLECTION_ADD_CREATION_MODAL]: AddToCollectionModal,
  [MODAL_TYPES.CONCEPT_SELECT_MODAL]: SelectConceptModal,
  [MODAL_TYPES.CHARACTER_SELECT_MODAL]: SelectCharacterModal,
  [MODAL_TYPES.MANNA_REFILL_MODAL]: MannaRefillModal,
  [MODAL_TYPES.FOLLOWERS_MODAL]: FollowersModal,
  [MODAL_TYPES.FOLLOWING_MODAL]: FollowingModal,
  [MODAL_TYPES.TASK_DETAIL_MODAL]: TaskDetailModal,
  [MODAL_TYPES.GENERATOR_SELECT_MODAL]: GeneratorSelectModal,
  [MODAL_TYPES.SUBSCRIPTION_GATE_MODAL]: SubscriptionGateModal,
}

type BaseModalProps = Partial<ModalProps> & {
  usesUrl?: boolean
  pageUrl?: string
  modalUrl?: string
  originPageUrl?: string
  className?: string
}

export type GeneratorSelectModalProps = Partial<
  BaseModalProps & {
    activeGenerator: Generator
    generators: Generator[]
    onChange: (generator: Generator) => void
  }
>

export type ConceptSelectModalProps = Partial<
  BaseModalProps & {
    onChange: (item: Concept) => void
  }
>

export type CharacterSelectModalProps = Partial<
  BaseModalProps & {
    onChange: (item: Character) => void
  }
>

export type ChannelDetailsModalProps = Partial<
  BaseModalProps & {
    title?: string
    itemType: ItemType
    query?: FeedRouteQueryParams
    orderBy: OrderByParam
    settings: ChannelSettings
  }
>

export type SubscriptionGateModalProps = Partial<
  BaseModalProps & {
    featureName: string
    minimumSubscriptionTier: SubscriptionTier
  }
>

export type ItemType = 'creation' | 'concept' | 'character' | 'creator'

export type DetailModalProps = Partial<
  BaseModalProps & {
    itemType: ItemType
    parentMasonryKey: string
    maybeLoadMoreFn: (
      currentIndex: number,
      currentItems: Creation[] | Concept[] | Character[] | Creator[],
    ) => void
  }
>

export type DetailStaticModalProps = Partial<
  BaseModalProps & {
    itemType: ItemType
    item: CardData | Creator
  }
>

export type AddToCollectionModalProps = Partial<
  BaseModalProps & {
    creationId: string
    centered: true
  }
>

type ModalStore = {
  modalId: number
  modalType: string | undefined
  modalProps?:
    | DetailStaticModalProps
    | DetailModalProps
    | ChannelDetailsModalProps
    | AddToCollectionModalProps
    | GeneratorSelectModalProps
    | ConceptSelectModalProps
    | CharacterSelectModalProps
    | SubscriptionGateModalProps
    | Partial<BaseModalProps & { concept?: Concept }>
    | (Partial<BaseModalProps> & { creatorId: string; isOwnProfile: boolean })
    | (Partial<BaseModalProps> & { task?: Task })
    | undefined
}

export interface ModalContextType {
  showModal: (
    modalType: ModalStore['modalType'],
    modalProps?: ModalStore['modalProps'],
  ) => number
  hideModal: (
    modalId: ModalStore['modalId'] | null,
    modalType?: ModalStore['modalType'],
  ) => void
}

const initialState: ModalContextType = {
  showModal: () => 0,
  hideModal: () => {},
}

const ModalContext = createContext(initialState)
export const useModalContext = () => useContext(ModalContext)

export const CloseButton = () => {
  return (
    <div className="text-white text-xl">
      <CloseOutlined />
    </div>
  )
}

function ModalProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<ModalStore[]>([])
  const router = useRouter()

  const showModal = (
    modalType: ModalStore['modalType'],
    modalProps: ModalStore['modalProps'] = {},
  ) => {
    const modalId = Date.now()
    setStore([...store, { modalType, modalProps, modalId }])

    // // @todo: ---start ugly--- this should be handled with ref.current to be more robust but we'll need to create own modal component as ant doesnt allow passing refs
    const modalWrapDomElement =
      document.getElementsByClassName('ant-modal-wrap')

    // console.log({ modalWrapDomElement })
    if (modalWrapDomElement && modalWrapDomElement.length) {
      modalWrapDomElement[0].scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }

    // @todo ---end ugly---
    return modalId
  }

  const hideModal = (
    modalId: ModalStore['modalId'] | null,
    modalType?: ModalStore['modalType'],
  ) => {
    if (modalId) {
      setStore(store.filter(storeItem => storeItem.modalId !== modalId))
      return
    }

    if (modalType) {
      setStore(store.filter(storeItem => storeItem.modalType !== modalType))
    }
  }

  const renderComponents = () => {
    return (
      <>
        {store && store.length
          ? store.map((modal, index) => renderComponent(index, modal))
          : null}
      </>
    )
  }
  const renderComponent = (index: number, modal: ModalStore) => {
    if (!modal || !modal.modalType) {
      return
    }

    const ModalComponent = MODAL_COMPONENTS[modal.modalType]
    if (!ModalComponent) {
      return null
    }

    const defaultModalProps = {
      closeIcon: <CloseButton />,
      className:
        'flex overflow-hidden flex-col mx-auto relative z-20 w-full h-auto my-4 lg:items-center lg:justify-center my-4 lg:my-12 lg:mt-4 shadow-2xl',
      onCancel: async () => {
        // console.log('onCancel', modal)
        hideModal(modal?.modalId)
        if (modal?.modalProps?.usesUrl) {
          if (modal?.modalProps?.originPageUrl) {
            await router.push(
              modal?.modalProps?.originPageUrl,
              modal?.modalProps?.originPageUrl,
              { shallow: true, scroll: false },
            )
          } else {
            router.back()
          }
        }
      },
      width: '',
      open: true,
      title: null,
      footer: null,
      focusTriggerAfterClose: false,
    }

    const defaultClassNames = defaultModalProps?.className?.split(' ')
    const customClassNames = modal?.modalProps?.className
      ? modal?.modalProps?.className.split(' ')
      : []
    const classNames = customClassNames.length
      ? defaultClassNames?.concat(
          customClassNames.filter(item => defaultClassNames.indexOf(item) < 0),
        )
      : defaultClassNames

    // console.log({ numModals: store.length, index })

    // // if (index > 0) {
    //   return (
    //     <MasonryProvider key={`${modal.modalType}_${index}`} id={`${modal.modalType}_${index}`}>
    //       {/*// @ts-ignore*/}
    //       <ModalComponent
    //         {...({ ...defaultModalProps, ...modal.modalProps } as ModalProps)}
    //         handleCancel={modal.modalProps?.onCancel}
    //         className={classNames}
    //       />
    //     </MasonryProvider>
    //   )
    // // }

    return (
      // @ts-ignore
      <ModalComponent
        key={`${modal.modalType}_${index}`}
        {...({ ...defaultModalProps, ...modal.modalProps } as ModalProps)}
        handleCancel={modal.modalProps?.onCancel}
        className={classNames}
      />
    )
  }

  useEffect(() => {
    router.events.on('routeChangeStart', (url, { shallow }) => {
      // if routing is not shallow, it's not leading to a modal, so we close it if there is one open
      if (store.length && !shallow) {
        hideModal(store[store.length - 1].modalId)
      }
    })

    return () => {
      router.events.off('routeChangeStart', () => {})
    }
  }, [store])

  const onEscHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopImmediatePropagation()
        ev.stopPropagation()

        if (store.length) {
          hideModal(store[store.length - 1].modalId)
        }
      }
    },
    [store],
  )

  useEffect(() => {
    document.body.addEventListener('keydown', onEscHandler, false)

    return () => {
      document.body.removeEventListener('keydown', onEscHandler, false)
    }
  }, [onEscHandler])

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      <div tabIndex={0} className="outline-0">
        {renderComponents()}
      </div>
      {children}
    </ModalContext.Provider>
  )
}

export default ModalProvider
