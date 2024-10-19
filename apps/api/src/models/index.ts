import { ApiKey, ApiKeyDocument } from './ApiKey'
import Challenge, { ChallengeDocument } from './Challenge'
import { Character, CharacterDocument } from './Character'
import { Collection, CollectionDocument } from './Collection'
import { Concept, ConceptDocument } from './Concept'
import { Creation, CreationDocument } from './Creation'
import { User, UserDocument } from './Creator'
import { Embedding, EmbeddingDocument } from './Embedding'
import { Follow, FollowDocument } from './Follow'
import { Generator, GeneratorDocument } from './Generator'
import { Manna, MannaDocument } from './Manna'
import { MannaVoucher, MannaVoucherDocument } from './MannaVoucher'
import { Reaction, ReactionDocument } from './Reaction'
import { Session, SessionDocument } from './Session'
import { SessionEvent, SessionEventDocument } from './SessionEvent'
import { Task, TaskDocument } from './Task'
import { Transaction, TransactionDocument } from './Transaction'
import { UserMigration, UserMigrationDocument } from './UserMigration'
import { CollectionV2Document } from './v2/CollectionV2'
import { CollectionV2 } from './v2/CollectionV2'
import { CreationV2, CreationV2Document } from './v2/CreationV2'
import { GeneratorV2, GeneratorV2Document } from './v2/GeneratorV2'
import { ModelV2, ModelV2Document } from './v2/ModelV2'
import { TaskV2, TaskV2Document } from './v2/TaskV2'
import { Model } from 'mongoose'

export interface Database {
  User: Model<UserDocument>
  Manna: Model<MannaDocument>
  MannaVoucher: Model<MannaVoucherDocument>
  ApiKey: Model<ApiKeyDocument>
  Follow: Model<FollowDocument>
  Task: Model<TaskDocument>
  TaskV2: Model<TaskV2Document>
  Creation: Model<CreationDocument>
  CreationV2: Model<CreationV2Document>
  Embedding: Model<EmbeddingDocument>
  Concept: Model<ConceptDocument>
  ModelV2: Model<ModelV2Document>
  Reaction: Model<ReactionDocument>
  Collection: Model<CollectionDocument>
  CollectionV2: Model<CollectionV2Document>
  Transaction: Model<TransactionDocument>
  Generator: Model<GeneratorDocument>
  GeneratorV2: Model<GeneratorV2Document>
  Character: Model<CharacterDocument>
  Challenge: Model<ChallengeDocument>
  Session: Model<SessionDocument>
  SessionEvent: Model<SessionEventDocument>
  UserMigration: Model<UserMigrationDocument>
}

export const models: Database = {
  User,
  Manna,
  MannaVoucher,
  ApiKey,
  Follow,
  Embedding,
  Task,
  TaskV2,
  Creation,
  CreationV2,
  Concept,
  ModelV2,
  Reaction,
  Collection,
  CollectionV2,
  Transaction,
  Generator,
  GeneratorV2,
  Character,
  Challenge,
  Session,
  SessionEvent,
  UserMigration,
}
