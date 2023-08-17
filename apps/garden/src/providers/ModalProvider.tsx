import ConceptDetailModal from '@/components/Modals/ConceptDetailModal'
import CreationDetailModal from '@/components/Modals/CreationDetailModal'
import MannaRefillModal from '@/components/Modals/MannaRefillModal'
import { CloseOutlined } from '@ant-design/icons'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { ModalProps } from 'antd'
import { useRouter } from 'next/router'
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

export enum MODAL_TYPES {
  CREATION_DETAIL_MODAL = 'CREATION_DETAIL_MODAL',
  CONCEPT_DETAIL_MODAL = 'CONCEPT_DETAIL_MODAL',
  MANNA_REFILL_MODAL = 'MANNA_REFILL_MODAL',
}

type GenericModalParams = unknown
const MODAL_COMPONENTS: { [key: string]: GenericModalParams } = {
  [MODAL_TYPES.CREATION_DETAIL_MODAL]: CreationDetailModal,
  [MODAL_TYPES.CONCEPT_DETAIL_MODAL]: ConceptDetailModal,
  [MODAL_TYPES.MANNA_REFILL_MODAL]: MannaRefillModal,
}

type ModalStore = {
  modalType: string | undefined
  modalProps?:
    | Partial<ModalProps & { creation?: Creation; loadSimilar?: boolean }>
    | Partial<ModalProps & { concept?: Concept }>
    | Partial<ModalProps>
    | undefined
  usesUrl?: boolean
}

export interface ModalContextType {
  showModal: (
    modalType: ModalStore['modalType'],
    modalProps?: ModalStore['modalProps'],
    usesUrl?: ModalStore['usesUrl'],
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
    usesUrl?: boolean,
  ) => {
    setStore({
      ...store,
      modalType,
      modalProps,
      usesUrl,
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
      usesUrl: undefined,
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
    onCancel: () => {
      hideModal()
      if (store?.usesUrl) {
        router.back()
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

    return (
      // @ts-ignore
      <ModalComponent
        {...({ ...defaultModalProps, ...store.modalProps } as ModalProps)}
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

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {renderComponent()}
      {children}
    </ModalContext.Provider>
  )
}

export default ModalProvider
