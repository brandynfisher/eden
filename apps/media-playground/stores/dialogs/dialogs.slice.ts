import { createSlice } from '@reduxjs/toolkit'

export interface DialogsState {
  addToCollectionModal: {
    isOpen: boolean
  }
  createCollectionModal: {
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
  },
})

export const { toggleAddToCollectionModal, toggleCreateCollectionModal } =
  dialogsSlice.actions

export default dialogsSlice.reducer
