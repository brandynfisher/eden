import { RootState, useAppSelector } from '@/stores/store'

export const selectDialogs = (state: RootState) => state.dialogs

export const useDialogs = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs
}

export const useAddToCollectionModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.addToCollectionModal.isOpen
}

export const useCreateCollectionModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.createCollectionModal.isOpen
}

export const useShareDialogOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.shareDialog.isOpen
}
