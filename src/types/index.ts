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
  REJECTED = 'rejected'
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  subType?: string;
  region: string;
  bio: string;
  resources?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  engagementScore: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}
