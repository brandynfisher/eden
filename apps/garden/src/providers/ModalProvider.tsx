import CircleButton from '@/components/Layout/buttons/CircleButton'
import ConceptDetailModal from '@/components/Modals/ConceptDetailModal'
import CreationDetailModal from '@/components/Modals/CreationDetailModal'
import CreationDetailStaticModal from '@/components/Modals/CreationDetailStaticModal'
import FollowersModal from '@/components/Modals/FollowersModal'
import FollowingModal from '@/components/Modals/FollowingModal'
import MannaRefillModal from '@/components/Modals/MannaRefillModal'
import TaskDetailModal from '@/components/Modals/TaskDetailModal'
import { CloseOutlined } from '@ant-design/icons'
import { Concept, Creation, Task } from '@edenlabs/eden-sdk'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
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
  CREATION_DETAIL_MODAL = 'CREATION_DETAIL_MODAL',
  CREATION_DETAIL_STATIC_MODAL = 'CREATION_DETAIL_STATIC_MODAL',
  CONCEPT_DETAIL_MODAL = 'CONCEPT_DETAIL_MODAL',
  MANNA_REFILL_MODAL = 'MANNA_REFILL_MODAL',
  FOLLOWERS_MODAL = 'FOLLOWERS_MODAL',
  FOLLOWING_MODAL = 'FOLLOWING_MODAL',
  TASK_DETAIL_MODAL = 'TASK_DETAIL_MODAL',
}

type GenericModalParams = unknown
const MODAL_COMPONENTS: { [key: string]: GenericModalParams } = {
  [MODAL_TYPES.CREATION_DETAIL_MODAL]: CreationDetailModal,
  [MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL]: CreationDetailStaticModal,
  [MODAL_TYPES.CONCEPT_DETAIL_MODAL]: ConceptDetailModal,
  [MODAL_TYPES.MANNA_REFILL_MODAL]: MannaRefillModal,
  [MODAL_TYPES.FOLLOWERS_MODAL]: FollowersModal,
  [MODAL_TYPES.FOLLOWING_MODAL]: FollowingModal,
  [MODAL_TYPES.TASK_DETAIL_MODAL]: TaskDetailModal,
}

type BaseModalProps = Partial<ModalProps> & {
  usesUrl?: boolean
  pageUrl?: string
  modalUrl?: string
  originPageUrl?: string
  className?: string
}
type ModalStore = {
  modalType: string | undefined
  modalProps?:
    | Partial<BaseModalProps & { creation?: Creation; loadSimilar?: boolean }>
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
  hideModal: () => void
}

const initialState: ModalContextType = {
  showModal: () => {},
  hideModal: () => {},
}

const ModalContext = createContext(initialState)
export const useModalContext = () => useContext(ModalContext)

function ModalProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<ModalStore>()
  const router = useRouter()

  const showModal = (
    modalType: ModalStore['modalType'],
    modalProps: ModalStore['modalProps'] = {},
  ) => {
    setStore({
      ...store,
      modalType,
      modalProps,
    })

    // @todo: ---start ugly--- this should be handled with ref.current to be more robust but we'll need to create own modal component as ant doesnt allow passing refs
    const modalWrapDomElement =
      document.getElementsByClassName('ant-modal-wrap')
    if (modalWrapDomElement && modalWrapDomElement.length) {
      modalWrapDomElement[0].scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
    // @todo ---end ugly---
  }

  const hideModal = () => {
    setStore({
      ...store,
      modalType: undefined,
      modalProps: {},
    })
  }

  const CloseButton = () => {
    return (
      <div className="text-white text-xl">
        <CloseOutlined />
      </div>
    )
  }

  const defaultModalProps: ModalProps = {
    closeIcon: <CloseButton />,
    className:
      'flex overflow-hidden flex-col mx-auto relative z-20 w-full h-auto my-4 lg:items-center lg:justify-center my-4 lg:my-12 lg:mt-4 shadow-2xl',
    onCancel: async () => {
      hideModal()
      if (store?.modalProps?.usesUrl) {
        if (store?.modalProps?.originPageUrl) {
          await router.push(
            store?.modalProps?.originPageUrl,
            store?.modalProps?.originPageUrl,
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
  }

  const renderComponent = () => {
    if (!store || !store.modalType) {
      return
    }

    const ModalComponent = MODAL_COMPONENTS[store.modalType]
    if (!ModalComponent) {
      return null
    }

    const defaultClassNames = defaultModalProps?.className?.split(' ')
    const customClassNames = store?.modalProps?.className
      ? store?.modalProps?.className.split(' ')
      : []
    const classNames = customClassNames.length
      ? defaultClassNames?.concat(
          customClassNames.filter(item => defaultClassNames.indexOf(item) < 0),
        )
      : defaultClassNames

    return (
      // @ts-ignore
      <ModalComponent
        {...({ ...defaultModalProps, ...store.modalProps } as ModalProps)}
        className={classNames}
      />
    )
  }

  useEffect(() => {
    router.beforePopState(({ as }) => {
      const currentPath = router.asPath
      if (as !== currentPath) {
        hideModal()
      }
      return true
    })

    return () => {
      router.beforePopState(() => true)
    }
  }, [router.asPath])

  useEffect(() => {
    router.events.on('routeChangeStart', (url, { shallow }) => {
      // if routing is not shallow, it's not leading to a modal, so we close it if there is one open
      if (!shallow) {
        hideModal()
      }
    })

    return () => {
      router.events.off('routeChangeStart', () => {})
    }
  }, [])

  const onEscHandler = useCallback((ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.stopImmediatePropagation()
      ev.stopPropagation()
      hideModal()
    }
  }, [])

  useEffect(() => {
    document.body.addEventListener('keydown', onEscHandler, false)

    return () => {
      document.body.removeEventListener('keydown', onEscHandler, false)
    }
  }, [onEscHandler])

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      <div tabIndex={0}>
        <div
          // className="fixed bottom-4 w-fit left-[calc(50%_-_42px)] md:bottom-auto flex md:justify-between md:top-1/2 md:w-[calc(100vw_-_32px)] md:left-2 gap-4 bg-gray-200 dark:bg-gray-950 rounded-full border border-solid border-gray-600 md:border-none md:p-0 md:dark:!bg-transparent"
          className="flex md:justify-between md:top-1/2 md:left-2 gap-4 bg-gray-200 dark:bg-gray-950 rounded-full border border-solid border-gray-600 md:border-none md:p-0 md:dark:!bg-transparent"
          style={{ zIndex: 1001 }}
        >
          <div className="justify-self-start pointer-events-auto">
            <CircleButton
              // disabled={currentIndex - 1 < 0}
              title={'Prev'}
              icon={<KeyboardArrowLeftIcon />}
              // onClick={() => handlePrevItem(currentIndex)}
            />
          </div>
          <div className="justify-self-end pointer-events-auto">
            <CircleButton
              // disabled={currentIndex + 1 >= totalItems}
              title={'Next'}
              icon={<KeyboardArrowRightIcon />}
              // onClick={() => handleNextItem(currentIndex)}
            />
          </div>
        </div>
        {renderComponent()}
        {children}
      </div>
    </ModalContext.Provider>
  )
}

export default ModalProvider
