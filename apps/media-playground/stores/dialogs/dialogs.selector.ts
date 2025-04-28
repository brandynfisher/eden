import { RootState, useAppSelector } from '@/stores/store'

export const selectDialogs = (state: RootState) => state.dialogs

export const useDialogs = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs
}

export const useQuickAnimateModal = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.quickAnimateModal
}

export const useQuickUpscaleModal = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.quickUpscaleModal
}

export const useAddToCollectionModal = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.addToCollectionModal
}

export const useCreateCollectionModalOpen = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.createCollectionModal.isOpen
}

export const useShareModal = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.shareDialog
}

export const useDeleteDialog = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.deleteDialog
}

export const useAgentFormSheet = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.agentFormSheet
}

export const useAgentDeploymentFormSheet = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.agentDeploymentFormSheet
}

export const useAgentTriggerFormSheet = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.agentTriggerFormSheet
}

export const useSubscriptionGateModal = () => {
  const dialogs = useAppSelector(selectDialogs)
  return dialogs.subscriptionGateModal
}
