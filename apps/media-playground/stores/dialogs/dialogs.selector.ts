import { RootState, useAppSelector } from '@/stores/store'

export const selectDialogs = (state: RootState) => state.dialogs

export const useDialogs = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs
}

export const useQuickAnimateModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.quickAnimateModal.isOpen
}

export const useAddToCollectionModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.addToCollectionModal.isOpen
}

export const useCreateCollectionModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.createCollectionModal.isOpen
}
