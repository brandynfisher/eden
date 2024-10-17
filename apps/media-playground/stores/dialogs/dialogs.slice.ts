import { createSlice } from '@reduxjs/toolkit'
import { isMobile } from 'react-device-detect'
import { toast } from 'sonner'

export interface DialogsState {
  addToCollectionModal: {
    isOpen: boolean
  }
  createCollectionModal: {
    isOpen: boolean
  }
  shareDialog: {
    isOpen: boolean
  }
}

const initialState: DialogsState = {
  addToCollectionModal: {
    isOpen: false,
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
    toggleAddToCollectionModal(state) {
      state.addToCollectionModal.isOpen = !state.addToCollectionModal.isOpen
    },
    toggleCreateCollectionModal(state) {
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
  toggleAddToCollectionModal,
  toggleCreateCollectionModal,
  toggleShareDialog,
} = dialogsSlice.actions

export default dialogsSlice.reducer
