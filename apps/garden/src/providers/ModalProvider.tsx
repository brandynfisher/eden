import AddToCollectionModal from '@/components/Modals/AddToCollectionModal'
import ConceptDetailModal from '@/components/Modals/ConceptDetailModal'
import ConceptSelectModal from '@/components/Modals/ConceptSelectModal'
import CreationDetailModalV2 from '@/components/Modals/CreationDetailModalV2'
import CreationDetailStaticModal from '@/components/Modals/CreationDetailStaticModal'
import FollowersModal from '@/components/Modals/FollowersModal'
import FollowingModal from '@/components/Modals/FollowingModal'
import GeneratorSelectModal from '@/components/Modals/GeneratorSelectModal'
import MannaRefillModal from '@/components/Modals/MannaRefillModal'
import TaskDetailModal from '@/components/Modals/TaskDetailModal'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import { Concept, Creation, Generator, Task } from '@edenlabs/eden-sdk'
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
  CREATION_DETAIL_MODAL_V2 = 'CREATION_DETAIL_MODAL_V2',
  CREATION_DETAIL_STATIC_MODAL = 'CREATION_DETAIL_STATIC_MODAL',
  COLLECTION_ADD_CREATION_MODAL = 'COLLECTION_ADD_CREATION_MODAL',
  CONCEPT_DETAIL_MODAL = 'CONCEPT_DETAIL_MODAL',
  CONCEPT_SELECT_MODAL = 'CONCEPT_SELECT_MODAL',
  MANNA_REFILL_MODAL = 'MANNA_REFILL_MODAL',
  FOLLOWERS_MODAL = 'FOLLOWERS_MODAL',
  FOLLOWING_MODAL = 'FOLLOWING_MODAL',
  TASK_DETAIL_MODAL = 'TASK_DETAIL_MODAL',
  GENERATOR_SELECT_MODAL = 'GENERATOR_SELECT_MODAL',
}

type GenericModalParams = unknown
const MODAL_COMPONENTS: { [key: string]: GenericModalParams } = {
  [MODAL_TYPES.CREATION_DETAIL_MODAL_V2]: CreationDetailModalV2,
  [MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL]: CreationDetailStaticModal,
  [MODAL_TYPES.COLLECTION_ADD_CREATION_MODAL]: AddToCollectionModal,
  [MODAL_TYPES.CONCEPT_DETAIL_MODAL]: ConceptDetailModal,
  [MODAL_TYPES.CONCEPT_SELECT_MODAL]: ConceptSelectModal,
  [MODAL_TYPES.MANNA_REFILL_MODAL]: MannaRefillModal,
  [MODAL_TYPES.FOLLOWERS_MODAL]: FollowersModal,
  [MODAL_TYPES.FOLLOWING_MODAL]: FollowingModal,
  [MODAL_TYPES.TASK_DETAIL_MODAL]: TaskDetailModal,
  [MODAL_TYPES.GENERATOR_SELECT_MODAL]: GeneratorSelectModal,
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
    onChange: (concept: Concept) => void
  }
>

export type CreationDetailModalV2Props = Partial<
  BaseModalProps & {
    initialItem: Creation
    maybeLoadMoreFn: (currentIndex: number, currentItems: Creation[]) => void
  }
>

export type AddToCollectionModalProps = Partial<
  BaseModalProps & {
    creationId: string
    centered: true
  }
>

type ModalStore = {
  modalType: string | undefined
  modalProps?:
    | Partial<BaseModalProps & { creation?: Creation; loadSimilar?: boolean }>
    | CreationDetailModalV2Props
    | AddToCollectionModalProps
    | GeneratorSelectModalProps
    | ConceptSelectModalProps
    | Partial<BaseModalProps & { concept?: Concept }>
    | (Partial<BaseModalProps> & { creatorId: string; isOwnProfile: boolean })
    | (Partial<BaseModalProps> & { task?: Task })
    | undefined
}

export interface ModalContextType {
  showModal: (
    modalType: ModalStore['modalType'],
    modalProps?: ModalStore['modalProps'],
  ) => void
  hideModal: (modalType: ModalStore['modalType']) => void
}

const initialState: ModalContextType = {
  showModal: () => {},
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
    setStore([...store, { modalType, modalProps }])

    // @todo: ---start ugly--- this should be handled with ref.current to be more robust but we'll need to create own modal component as ant doesnt allow passing refs
    const modalWrapDomElement =
      document.getElementsByClassName('ant-modal-wrap')
    if (modalWrapDomElement && modalWrapDomElement.length) {
      modalWrapDomElement[0].scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
    // @todo ---end ugly---
  }

  const hideModal = (modalType: ModalStore['modalType']) => {
    setStore(store.filter(storeItem => storeItem.modalType !== modalType))
  }

  const renderComponents = () => {
    return (
      <>
        {store && store.length
          ? store.map(modal => renderComponent(modal))
          : null}
      </>
    )
  }
  const renderComponent = (modal: ModalStore) => {
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
        hideModal(modal?.modalType)
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

    return (
      // @ts-ignore
      <ModalComponent
        key={modal.modalType}
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
        hideModal(store[store.length - 1].modalType)
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
          hideModal(store[store.length - 1].modalType)
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
        {children}
      </div>
    </ModalContext.Provider>
  )
}

export default ModalProvider
