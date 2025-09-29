import { SessionDocument } from './Session'
import { UserDocument } from './User'
import { Document, Schema, model } from 'mongoose'

export enum SessionPermissionLevel {
  Editor = 'editor',
  Owner = 'owner',
}

export interface SessionPermissionSchema {
  session: SessionDocument['_id']
  user: UserDocument['_id']
  level: SessionPermissionLevel
  grantedBy: UserDocument['_id']
  grantedAt: Date
}

export interface SessionPermissionDocument
  extends SessionPermissionSchema,
    Document {}

const SessionPermissionSchema = new Schema<SessionPermissionDocument>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions_v2',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    level: {
      type: String,
      enum: Object.values(SessionPermissionLevel),
      required: true,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for unique user-session pairs
SessionPermissionSchema.index({ session: 1, user: 1 }, { unique: true })

// Index for querying all permissions for a specific session
SessionPermissionSchema.index({ session: 1, level: 1 })

// Index for querying all sessions shared with a specific user
SessionPermissionSchema.index({ user: 1, level: 1 })

// Index for querying by permission level
SessionPermissionSchema.index({ level: 1 })

export const SessionPermission = model<SessionPermissionDocument>(
  'session_permissions',
  SessionPermissionSchema,
)
