


export type Vehicle = {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  motorNumber: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleIds: string[];
};

export type Part = {
  sku: string;
  name: string;
  stock: number;
  location: string;
  alertThreshold: number;
  cost: number; // Costo de compra para el taller
  price: number; // Precio de venta al cliente
};

export type WorkOrderStatus = 'Recibido' | 'Esperando Aprobación' | 'En Reparación' | 'Esperando Repuestos' | 'Completado' | 'Entregado';
export type WorkOrderType = 'Mantención Preventiva' | 'Mantención Correctiva';

export type ServiceLogEntry = {
  timestamp: string;
  technician: string;
  entry: string;
};

export type WorkOrderPart = {
    name: string; 
    sku: string; 
    quantity: number;
    cost: number; // Costo del repuesto al momento de la OT
    price: number; // Precio de venta al momento de la OT
}

export type WorkOrder = {
  id: string;
  clientId: string;
  vehicleId: string;
  service: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  technician: string;
  entryDate: string;
  completionDate?: string;
  serviceLog: ServiceLogEntry[];
  parts: WorkOrderPart[];
  laborHours: number; // Horas de mano de obra
  satisfactionRating?: number;
  satisfactionComment?: string;
  finalReport?: string;
};

export type EnrichedWorkOrder = WorkOrder & {
  client: Client;
  vehicle: Vehicle;
};

export type QuoteStatus = 'Enviada' | 'Aprobada' | 'Rechazada';

export type QuoteItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export type Quote = {
    id: string;
    clientId: string;
    vehicleId: string;
    date: string;
    items: QuoteItem[];
    total: number;
    status: QuoteStatus;
}

export type CalendarEvent = {
  id: string;
  start: string;
  end: string;
  title: string;
  vehicle: string;
  technician: string;
  workstation: number;
};

export type Checklist = {
  id: string;
  type: 'Recepción' | 'Entrega';
  vehiclePlate: string;
  date: string;
  completed: boolean;
  notes: string;
  images: string[];
  checkedItems: { [key: string]: boolean };
};

export type PurchaseOrderItem = {
    sku: string;
    name: string;
    quantity: number;
};

export type PurchaseOrder = {
    supplier: string;
    items: PurchaseOrderItem[];
};

export type NotificationStatus = 'Programada' | 'Enviada' | 'Fallida';

export type Notification = {
  id: string;
  clientId: string;
  vehicleId: string;
  type: string;
  sendDate: string;
  status: NotificationStatus;
  channel?: 'Email' | 'WhatsApp';
  lastServiceDate?: string;
};

export type FleetContractStatus = 'Activo' | 'Vencido' | 'En Negociación';

export type FleetContract = {
  id: string;
  companyName: string;
  vehicleCount: number;
  planType: string; // Changed from enum to string to allow custom plans
  status: FleetContractStatus;
  startDate: string;
  endDate: string;
};

export type MaintenancePlan = {
  id: string;
  name: string;
  description: string;
  tasks: { description: string }[];
};

export type Technician = {
    id: string;
    name: string;
    avatarUrl: string;
    specialties: string[];
    hireDate: string;
    contact: string;
    baseSalary: number;
    extraHourRate: number;
    extraHoursThisMonth: number;
    maxExtraHours: number;
};

export type UserRole = 'admin' | 'mechanic' | 'client';

export type User = {
    uid: string;
    email: string | null;
    name: string | null;
    avatarUrl?: string;
    role: UserRole;
};
