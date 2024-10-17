import { createSlice } from '@reduxjs/toolkit'

export interface DialogsState {
  quickAnimateModal: {
    isOpen: boolean
  }
  addToCollectionModal: {
    isOpen: boolean
  }
  createCollectionModal: {
    isOpen: boolean
  }
}

const initialState: DialogsState = {
  quickAnimateModal: {
    isOpen: false,
  },
  addToCollectionModal: {
    isOpen: false,
  },
  createCollectionModal: {
    isOpen: false,
  },
}

const dialogsSlice = createSlice({
  name: 'dialogs',
  initialState,
  reducers: {
    toggleQuickAnimateModal(state) {
      // console.log('toggleQuickAnimateModal', state, !state.quickAnimateModal.isOpen)
      state.quickAnimateModal.isOpen = !state.quickAnimateModal.isOpen
    },
    toggleAddToCollectionModal(state) {
      // console.log('toggleAddToCollectionModal', state, !state.addToCollectionModal.isOpen)
      state.addToCollectionModal.isOpen = !state.addToCollectionModal.isOpen
    },
    toggleCreateCollectionModal(state) {
      // console.log('toggleCreateCollectionModal', state, !state.createCollectionModal.isOpen)
      state.createCollectionModal.isOpen = !state.createCollectionModal.isOpen
    },
  },
})

export const {
  toggleQuickAnimateModal,
  toggleAddToCollectionModal,
  toggleCreateCollectionModal,
} = dialogsSlice.actions

export default dialogsSlice.reducer
