export enum ActorType {
  COMPANY = 'company',
  MENTOR = 'mentor',
  PARTNER = 'partner',
  SERVICE_PROVIDER = 'service_provider'
}

export enum LinkageStatus {
  PROPOSED = 'proposed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export interface ReviewEntry {
  entity1Rating: number;
  entity1Text: string;
  entity2Rating: number;
  entity2Text: string;
  timestamp: string;
}

export interface EngagementRecord {
  linkageId: string;
  score: number;
  summary: string;
  date: string;
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  subType?: string;
  region: string;
  bio: string;
  email?: string;
  resources?: string;
  metadata: Record<string, any>;
  engagementHistory?: EngagementRecord[];
  createdAt: any;
  updatedAt: any;
  ownerId: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  region: string;
  active: boolean;
  createdBy: string;
  partnerNames?: string[];
}

export interface Linkage {
  id: string;
  sourceId: string;
  targetId: string;
  programId?: string;
  type: string;
  status: LinkageStatus;
  aiJustification: string;
  aiSummary?: string;
  engagementScore: number;
  reviews?: ReviewEntry[];
  createdAt: any;
  updatedAt: any;
  createdById: string;
}
