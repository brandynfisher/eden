import { CreationV2 } from '@edenlabs/eden-sdk'
import { createSlice } from '@reduxjs/toolkit'
import { isMobile } from 'react-device-detect'
import { toast } from 'sonner'

export interface DialogsState {
  quickAnimateModal: {
    isOpen: boolean
    creation?: CreationV2
  }
  addToCollectionModal: {
    isOpen: boolean
    creationIds: string[]
  }
  createCollectionModal: {
    isOpen: boolean
  }
  shareDialog: {
    isOpen: boolean
  }
}

const initialState: DialogsState = {
  quickAnimateModal: {
    isOpen: false,
    creation: undefined,
  },
  addToCollectionModal: {
    isOpen: false,
    creationIds: [],
  },
  createCollectionModal: {
    isOpen: false,
  },
  shareDialog: {
    isOpen: false,
    useNativeShare: false,
  },
}

const dialogsSlice = createSlice({
  name: 'dialogs',
  initialState,
  reducers: {
    updateQuickAnimateModal(state, action: { payload: { isOpen: boolean, creation?: CreationV2 } }) {
      // console.log('toggleQuickAnimateModal', state, !state.quickAnimateModal.isOpen)
      state.quickAnimateModal.isOpen = action.payload.isOpen
      if (action.payload.creation) {
        state.quickAnimateModal.creation = action.payload.creation
      } else {
        state.quickAnimateModal.creation = undefined
      }
    },
    updateAddToCollectionModal(state, action: { payload: { isOpen: boolean, creationIds?: string[] } }   ) {
      state.addToCollectionModal.isOpen = action.payload.isOpen
      if (action.payload.creationIds) {
        state.addToCollectionModal.creationIds = action.payload.creationIds
      } else {
        state.addToCollectionModal.creationIds = []
      }
    },
    toggleCreateCollectionModal(state) {
      // console.log('toggleCreateCollectionModal', state, !state.createCollectionModal.isOpen)
      state.createCollectionModal.isOpen = !state.createCollectionModal.isOpen
    },
    toggleShareDialog(state) {
      if (!isMobile) {
        state.shareDialog.isOpen = !state.shareDialog.isOpen
      } else {
        if (navigator && navigator.share) {
          navigator.share({
            title: 'Share',
            text: 'Check out this on Eden',
            url: window.location.href,
          })
          return
        }
        toast.info('Share not supported on this device', {
          description: 'Please copy the link to share',
          richColors: true,
          dismissible: true,
        })
      }
    },
  },
})

export const {
  toggleShareDialog,
  updateQuickAnimateModal,
  updateAddToCollectionModal,
  toggleCreateCollectionModal,
} = dialogsSlice.actions

export default dialogsSlice.reducer
