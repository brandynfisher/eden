import { createSlice } from '@reduxjs/toolkit'

export interface DialogsState {
  quickAnimateModal: {
    isOpen: boolean
  }
  addToCollectionModal: {
    isOpen: boolean
    creationIds: string[]
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
    creationIds: [],
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
  },
})

export const {
  toggleQuickAnimateModal,
  updateAddToCollectionModal,
  toggleCreateCollectionModal,
} = dialogsSlice.actions

export default dialogsSlice.reducer
