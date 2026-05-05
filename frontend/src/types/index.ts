// User and Role Types
export type UserRole = 'Admin' | 'SalesManager' | 'SalesMember';
export type PotentialLevel = 'A' | 'B' | 'C';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
  doctorCount: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  phone: string;
  zalo?: string;
  hospitalId: string;
  hospitalName?: string;
  address?: string;
  potentialLevel: PotentialLevel;
  assignedSalesId?: string;
  assignedSalesName?: string;
  createdAt: string;
}

// API Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  Data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDoctorRequest {
  name: string;
  specialty?: string;
  phone: string;
  zalo?: string;
  hospitalId: string;
  address?: string;
  potentialLevel: PotentialLevel;
  assignedSalesId?: string;
}

export interface CreateHospitalRequest {
  name: string;
  address?: string;
}

// Deal types
export type DealStage = 'NEW' | 'IN_PROGRESS' | 'NEGOTIATION' | 'WON' | 'LOST';
export type ProductType = 'SILICONE' | 'CREAM';
export type LostReason = 'COMPETITOR' | 'BUDGET' | 'TIMELINE' | 'NO_RESPONSE' | 'PRODUCT_MISMATCH' | 'OTHER';

export interface Deal {
  id: string;
  doctorId: string;
  doctorName: string;
  salesId: string;
  salesName: string;
  product: ProductType;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string | null;
  notes: string | null;
  position: number;
  version: number;
  lostReason?: LostReason;
  lostNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealRequest {
  doctorId: string;
  product: ProductType;
  quantity: number;
  unitPrice: number;
  expectedCloseDate?: string;
  notes?: string;
}

export interface UpdateDealRequest {
  product?: ProductType;
  quantity?: number;
  unitPrice?: number;
  expectedCloseDate?: string;
  notes?: string;
}

export interface UpdateStageRequest {
  stage: DealStage;
  expectedVersion?: number;
  lostReason?: LostReason;
  lostNotes?: string;
}

export interface StageMetric {
  count: number;
  totalValue: number;
}

export interface PipelineResponse {
  stages: Record<DealStage, Deal[]>;
  metrics: Record<DealStage, StageMetric>;
}

export interface ForecastStageItem {
  stage: DealStage;
  count: number;
  totalValue: number;
  weightedValue: number;
}

export interface ForecastResponse {
  stages: ForecastStageItem[];
  totalPipelineValue: number;
  weightedForecast: number;
}

// Task types
export type TaskType = 'FOLLOW_UP' | 'DEAL_CLOSING' | 'DEAL_OVERDUE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  score: number;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  dealId?: string;
  dealName?: string;
  dealValue?: number;
  dealStage?: DealStage;
  dueAt: string;
  overdueDays: number;
  lastActivityAt?: string;
}

export interface TasksSummary {
  total: number;
  overdue: number;
  closingSoon: number;
  today: number;
}

export interface TasksResponse {
  tasks: TaskItem[];
  summary: TasksSummary;
}

export type TaskFilter = 'ALL' | 'OVERDUE' | 'CLOSING_SOON' | 'TODAY';

// Order types
export type OrderStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED';

export interface Order {
  id: string;
  dealId: string;
  doctorId: string;
  doctorName: string;
  product: ProductType;
  quantity: number;
  price: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: Order[];
  totalCount: number;
}

// Daily Plan types
export type PlanTaskCategory = 'MUST_DO' | 'SHOULD_DO' | 'NICE_TO_HAVE';
export type PlanTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED_AUTO' | 'COMPLETED_MANUAL' | 'SKIPPED' | 'EXPIRED' | 'OFF_TRACK';
export type PlanStatus = 'ON_TRACK' | 'OFF_TRACK' | 'COMPLETED' | 'NOT_STARTED';
export type CapacityMode = 'NORMAL' | 'RECOVERY' | 'STRETCH';

export interface DailyPlanTask {
  id: string;
  plannedStart: string;
  actualStart?: string;
  delayMinutes: number;
  plannedDurationMinutes: number;
  category: PlanTaskCategory;
  score: number;
  status: PlanTaskStatus;
  isLowConfidence: boolean;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  taskType: string;
  dealValue?: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
}

export interface CapacityInfo {
  mustDoLimit: number;
  shouldDoLimit: number;
  startTime: string;
  mode: CapacityMode;
}

export interface DailyPlan {
  id: string;
  date: string;
  status: PlanStatus;
  activeTaskId?: string;
  completionRate: number;
  confidenceScore: number;
  isRecoveryMode: boolean;
  capacity: CapacityInfo;
  mustDo: DailyPlanTask[];
  shouldDo: DailyPlanTask[];
  niceToHave: DailyPlanTask[];
}

export interface ManualCompleteRequest {
  reasonCode: string;
  note?: string;
}

export interface SkipTaskRequest {
  reasonCode: string;
  note?: string;
}

export interface TeamMemberPlan {
  salesId: string;
  salesName: string;
  planStatus: string;
  activeTask?: { task: string; startedAt?: string };
  completed: number;
  mustDo: number;
  overdueCount: number;
  lastActivityAt?: string;
}

export interface TeamSummary {
  teamOnTrack: number;
  teamOffTrack: number;
  teamNotStarted: number;
  totalCompleted: number;
  totalMustDo: number;
}

export interface TeamDailyPlan {
  date: string;
  teamPlans: TeamMemberPlan[];
  summary: TeamSummary;
}