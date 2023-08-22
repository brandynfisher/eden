import { Model } from 'mongoose'

import { ApiKey, ApiKeyDocument } from './ApiKey'
import Challenge, { ChallengeDocument } from './Challenge'
import { Character, CharacterDocument } from './Character'
import { Collection, CollectionDocument } from './Collection'
import { Concept, ConceptDocument } from './Concept'
import { Creation, CreationDocument } from './Creation'
import { User, UserDocument } from './Creator'
import { Follow, FollowDocument } from './Follow'
import { Generator, GeneratorDocument } from './Generator'
import { Manna, MannaDocument } from './Manna'
import { MannaVoucher, MannaVoucherDocument } from './MannaVoucher'
import { Reaction, ReactionDocument } from './Reaction'
import { Scenario, ScenarioDocument } from './Scenario'
import { Session, SessionDocument } from './Session'
import { SessionEvent, SessionEventDocument } from './SessionEvent'
import { Task, TaskDocument } from './Task'
import { Transaction, TransactionDocument } from './Transaction'

export interface Database {
  User: Model<UserDocument>
  Manna: Model<MannaDocument>
  MannaVoucher: Model<MannaVoucherDocument>
  ApiKey: Model<ApiKeyDocument>
  Follow: Model<FollowDocument>
  Task: Model<TaskDocument>
  Creation: Model<CreationDocument>
  Concept: Model<ConceptDocument>
  Reaction: Model<ReactionDocument>
  Collection: Model<CollectionDocument>
  Transaction: Model<TransactionDocument>
  Generator: Model<GeneratorDocument>
  Character: Model<CharacterDocument>
  Challenge: Model<ChallengeDocument>
  Scenario: Model<ScenarioDocument>
  Session: Model<SessionDocument>
  SessionEvent: Model<SessionEventDocument>
}

export const models: Database = {
  User,
  Manna,
  MannaVoucher,
  ApiKey,
  Follow,
  Task,
  Creation,
  Concept,
  Reaction,
  Collection,
  Transaction,
  Generator,
  Character,
  Challenge,
  Scenario,
  Session,
  SessionEvent,
}
