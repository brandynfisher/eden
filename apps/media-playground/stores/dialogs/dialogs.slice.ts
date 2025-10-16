import { CreationV2, SubscriptionTier } from '@edenlabs/eden-sdk'
import { createSlice } from '@reduxjs/toolkit'
import { isMobile } from 'react-device-detect'
import { toast } from 'sonner'

export interface DialogsState {
  quickUpscaleModal: {
    isOpen: boolean
    creation?: CreationV2
  }
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
    shareUrl?: string
  }
  deleteDialog: {
    isOpen: boolean
    title: string
    description: string
    onDelete: () => void
  }
  agentFormSheet: {
    isOpen: boolean
    mode?: 'create' | 'update'
    agentId?: string
    onAction?: () => Promise<void>
  }
  agentDeploymentFormSheet: {
    isOpen: boolean
    agentId?: string
    onAction?: () => Promise<void>
  }
  agentTriggerFormSheet: {
    isOpen: boolean
    agentId?: string
  }
  subscriptionGateModal: {
    isOpen: boolean
    featureName: string
    minimumSubscriptionTier: SubscriptionTier
  }
}

const initialState: DialogsState = {
  quickUpscaleModal: {
    isOpen: false,
    creation: undefined,
  },
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
    shareUrl: undefined,
  },
  deleteDialog: {
    isOpen: false,
    title: '',
    description: '',
    onDelete: () => {},
  },
  agentFormSheet: {
    isOpen: false,
    mode: 'create',
    agentId: undefined,
  },
  agentDeploymentFormSheet: {
    isOpen: false,
    agentId: undefined,
  },
  agentTriggerFormSheet: {
    isOpen: false,
    agentId: undefined,
  },
  subscriptionGateModal: {
    isOpen: false,
    featureName: '',
    minimumSubscriptionTier: SubscriptionTier.Basic,
  },
}

const dialogsSlice = createSlice({
  name: 'dialogs',
  initialState,
  reducers: {
    closeAllQuickCreateModals(state) {
      state.quickAnimateModal.isOpen = false
      state.quickUpscaleModal.isOpen = false
    },
    updateQuickAnimateModal(
      state,
      action: { payload: { isOpen: boolean; creation?: CreationV2 } },
    ) {
      state.quickAnimateModal.isOpen = action.payload.isOpen
      if (action.payload.creation) {
        state.quickAnimateModal.creation = action.payload.creation
      } else {
        state.quickAnimateModal.creation = undefined
      }
    },
    updateQuickUpscaleModal(
      state,
      action: { payload: { isOpen: boolean; creation?: CreationV2 } },
    ) {
      state.quickUpscaleModal.isOpen = action.payload.isOpen
      if (action.payload.creation) {
        state.quickUpscaleModal.creation = action.payload.creation
      } else {
        state.quickUpscaleModal.creation = undefined
      }
    },
    updateAddToCollectionModal(
      state,
      action: { payload: { isOpen: boolean; creationIds?: string[] } },
    ) {
      state.addToCollectionModal.isOpen = action.payload.isOpen
      if (action.payload.creationIds) {
        state.addToCollectionModal.creationIds = action.payload.creationIds
      } else {
        state.addToCollectionModal.creationIds = []
      }
    },
    toggleCreateCollectionModal(state) {
      state.createCollectionModal.isOpen = !state.createCollectionModal.isOpen
    },
    updateShareModal(
      state,
      action: { payload: { isOpen: boolean; shareUrl?: string } },
    ) {
      if (!isMobile) {
        state.shareDialog.isOpen = action.payload.isOpen
        if (action.payload.shareUrl) {
          state.shareDialog.shareUrl = action.payload.shareUrl
        } else {
          state.shareDialog.shareUrl = undefined
        }
      } else {
        if (navigator && navigator.share) {
          navigator.share({
            title: 'Share',
            text: 'Check this on Eden',
            url: action.payload.shareUrl,
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
    updateDeleteDialog(
      state,
      action: {
        payload: {
          isOpen?: boolean
          title?: string
          description?: string
          onDelete?: () => void
        }
      },
    ) {
      if (!action.payload.isOpen) {
        state.deleteDialog.isOpen = false
        state.deleteDialog.title = ''
        state.deleteDialog.description = ''
        state.deleteDialog.onDelete = () => {}
      } else {
        state.deleteDialog = {
          ...state.deleteDialog,
          ...action.payload,
        }
      }
    },
    updateAgentFormSheet(
      state,
      action: {
        payload: {
          isOpen: boolean
          mode?: 'create' | 'update'
          agentId?: string
          onAction?: () => Promise<void>
        }
      },
    ) {
      if (!action.payload.isOpen) {
        state.agentFormSheet.isOpen = false
        delete state.agentFormSheet.mode
        delete state.agentFormSheet.agentId
        delete state.agentFormSheet.onAction
      } else {
        state.agentFormSheet.isOpen = action.payload.isOpen
        state.agentFormSheet.mode = action.payload.mode
        state.agentFormSheet.agentId = action.payload.agentId
        state.agentFormSheet.onAction = action.payload.onAction
      }
    },
    updateAgentDeploymentFormSheet(
      state,
      action: {
        payload: {
          isOpen: boolean
          agentId?: string
          onAction?: () => Promise<void>
        }
      },
    ) {
      if (!action.payload.isOpen) {
        state.agentDeploymentFormSheet.isOpen = false
        delete state.agentDeploymentFormSheet.agentId
        delete state.agentDeploymentFormSheet.onAction
      } else {
        state.agentDeploymentFormSheet.isOpen = action.payload.isOpen
        state.agentDeploymentFormSheet.agentId = action.payload.agentId
        state.agentDeploymentFormSheet.onAction = action.payload.onAction
      }
    },
    updateAgentTriggerFormSheet(
      state,
      action: { payload: { isOpen: boolean; agentId?: string } },
    ) {
      if (!action.payload.isOpen) {
        state.agentTriggerFormSheet.isOpen = false
        delete state.agentTriggerFormSheet.agentId
      } else {
        state.agentTriggerFormSheet.isOpen = action.payload.isOpen
        state.agentTriggerFormSheet.agentId = action.payload.agentId
      }
    },
    updateSubscriptionGateModal(
      state,
      action: {
        payload: {
          isOpen: boolean
          featureName: string
          minimumSubscriptionTier: SubscriptionTier
        }
      },
    ) {
      if (!action.payload.isOpen) {
        state.subscriptionGateModal.isOpen = false
        state.subscriptionGateModal.featureName =
          initialState.subscriptionGateModal.featureName
        state.subscriptionGateModal.minimumSubscriptionTier =
          initialState.subscriptionGateModal.minimumSubscriptionTier
      } else {
        state.subscriptionGateModal.isOpen = action.payload.isOpen
        state.subscriptionGateModal.featureName = action.payload.featureName
        state.subscriptionGateModal.minimumSubscriptionTier =
          action.payload.minimumSubscriptionTier
      }
    },
  },
})

export const {
  updateShareModal,
  updateQuickAnimateModal,
  updateQuickUpscaleModal,
  updateAddToCollectionModal,
  toggleCreateCollectionModal,
  updateDeleteDialog,
  updateAgentFormSheet,
  updateAgentDeploymentFormSheet,
  closeAllQuickCreateModals,
  updateAgentTriggerFormSheet,
  updateSubscriptionGateModal,
} = dialogsSlice.actions

export default dialogsSlice.reducer
