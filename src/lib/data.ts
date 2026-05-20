

import type { Client, Vehicle, WorkOrder, Quote, CalendarEvent, Part, ServiceLogEntry, FleetContract, MaintenancePlan, Technician } from '@/types';

export const vehicles: Vehicle[] = [
  { id: 'V001', licensePlate: 'ABCD-12', make: 'Toyota', model: 'Corolla', year: 2020, vin: '1234567890ABCDEFG', motorNumber: '1NZ-FE-12345' },
  { id: 'V002', licensePlate: 'EFGH-34', make: 'Honda', model: 'Civic', year: 2019, vin: '0987654321HGFEDCBA', motorNumber: 'R18Z1-67890' },
  { id: 'V003', licensePlate: 'IJKL-56', make: 'Ford', model: 'Focus', year: 2021, vin: '5432109876GFEDCBAH', motorNumber: 'M8DA-11223' },
  { id: 'V004', licensePlate: 'MNOP-78', make: 'Chevrolet', model: 'Cruze', year: 2018, vin: '6789012345FEDCBAHG', motorNumber: 'LUJ-44556' },
  { id: 'V005', licensePlate: 'QRST-90', make: 'Toyota', model: 'RAV4', year: 2022, vin: 'ABC123DEF456GHI789', motorNumber: 'A25A-FKS-77889' },
];

export const clients: Client[] = [
  { id: 'C001', name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '+56912345678', vehicleIds: ['V001', 'V005'] },
  { id: 'C002', name: 'María Rodríguez', email: 'maria.r@example.com', phone: '+56987654321', vehicleIds: ['V002'] },
  { id: 'C003', name: 'Carlos Gómez', email: 'carlos.gomez@example.com', phone: '+56911223344', vehicleIds: ['V003'] },
  { id: 'C004', name: 'Ana Martínez', email: 'ana.martinez@example.com', phone: '+56955667788', vehicleIds: ['V004'] },
];

export const parts: Part[] = [
  { sku: "OIL-SYN-5W30", name: "Aceite Sintético 5W-30 (Litro)", stock: 50, location: "Estante A-1", alertThreshold: 10, cost: 4500, price: 9000 },
  { sku: "FIL-TOY-COR-01", name: "Filtro de Aceite Toyota Corolla '19+", stock: 12, location: "Cajón B-3", alertThreshold: 5, cost: 6000, price: 12000 },
  { sku: "PAD-HON-CIV-F", name: "Pastillas de Freno Delanteras Honda Civic", stock: 8, location: "Estante C-2", alertThreshold: 5, cost: 22000, price: 45000 },
  { sku: "AC-FOR-FOC-03", name: "Compresor A/C Ford Focus", stock: 2, location: "Bodega", alertThreshold: 2, cost: 150000, price: 250000 },
  { sku: "BULB-H4", name: "Ampolleta Halógena H4", stock: 25, location: "Cajón D-1", alertThreshold: 10, cost: 1000, price: 3000 },
];

const initialServiceLog: ServiceLogEntry[] = [
  { timestamp: '2024-07-15T09:05:00Z', technician: 'Pedro Pascal', entry: 'Vehículo recibido. Se inicia revisión según pauta de mantención de 10.000km.' },
  { timestamp: '2024-07-15T11:30:00Z', technician: 'Pedro Pascal', entry: 'Cambio de aceite y filtro de aceite realizado.' },
  { timestamp: '2024-07-15T15:00:00Z', technician: 'Pedro Pascal', entry: 'Revisión de niveles, presión de neumáticos y chequeo de luces completado. Vehículo listo para entrega.' }
];


export const workOrders: WorkOrder[] = [
  {
    id: 'OT-2024-001',
    clientId: 'C001',
    vehicleId: 'V001',
    service: 'Mantención 10.000km',
    type: 'Mantención Preventiva',
    status: 'Entregado',
    technician: 'Pedro Pascal',
    entryDate: '2024-07-15T09:00:00Z',
    completionDate: '2024-07-15T16:30:00Z',
    serviceLog: initialServiceLog,
    parts: [
      { name: 'Aceite Sintético 5W-30', sku: 'OIL-SYN-5W30', quantity: 5, cost: 4500, price: 9000 },
      { name: 'Filtro de Aceite Toyota Corolla \'19+', sku: 'FIL-TOY-COR-01', quantity: 1, cost: 6000, price: 12000 },
    ],
    laborHours: 2.5,
    satisfactionRating: 5,
    satisfactionComment: "¡Excelente servicio, muy rápido y profesional!",
    finalReport: "Se realizó la mantención de 10.000km según pauta del fabricante. Se cambió aceite de motor y filtro. Se revisaron y rellenaron todos los niveles. No se encontraron otras fallas o puntos de atención. Se recomienda próxima mantención en 10.000km o 1 año."
  },
  {
    id: 'OT-2024-002',
    clientId: 'C002',
    vehicleId: 'V002',
    service: 'Inspección y Reparación de Frenos',
    type: 'Mantención Correctiva',
    status: 'En Reparación',
    technician: 'Ricardo Milos',
    entryDate: '2024-07-20T11:00:00Z',
    serviceLog: [
      { timestamp: '2024-07-20T11:05:00Z', technician: 'Ricardo Milos', entry: 'Cliente reporta ruido al frenar. Se realiza inspección visual y prueba de ruta.' },
      { timestamp: '2024-07-20T12:00:00Z', technician: 'Ricardo Milos', entry: 'Se desarma tren delantero. Pastillas de freno con 90% de desgaste. Discos con surcos leves.' },
    ],
    parts: [
        { name: 'Pastillas de Freno Delanteras Honda Civic', sku: 'PAD-HON-CIV-F', quantity: 1, cost: 22000, price: 45000 }
    ],
    laborHours: 2,
  },
  {
    id: 'OT-2024-003',
    clientId: 'C003',
    vehicleId: 'V003',
    service: 'Diagnóstico Sistema A/C',
    type: 'Mantención Correctiva',
    status: 'Esperando Repuestos',
    technician: 'Pedro Pascal',
    entryDate: '2024-07-22T14:00:00Z',
    serviceLog: [
      { timestamp: '2024-07-22T14:10:00Z', technician: 'Pedro Pascal', entry: 'Cliente indica que el A/C no enfría. Se conecta manómetro para revisar presiones.' },
      { timestamp: '2024-07-22T15:00:00Z', technician: 'Pedro Pascal', entry: 'Se detecta fuga en el sello del compresor usando tinte UV. Se cotiza y ordena compresor nuevo.' },
    ],
    parts: [
        { name: 'Compresor A/C Ford Focus', sku: 'AC-FOR-FOC-03', quantity: 1, cost: 150000, price: 250000 }
    ],
    laborHours: 1.5,
    satisfactionRating: 4,
    satisfactionComment: "El diagnóstico fue certero, pero la espera por el repuesto fue un poco larga."
  },
  {
    id: 'OT-2024-004',
    clientId: 'C004',
    vehicleId: 'V004',
    service: 'Diagnóstico Luz Check Engine',
    type: 'Mantención Correctiva',
    status: 'Esperando Aprobación',
    technician: 'Ricardo Milos',
    entryDate: '2024-07-25T10:30:00Z',
    serviceLog: [
      { timestamp: '2024-07-25T10:35:00Z', technician: 'Ricardo Milos', entry: 'Vehículo ingresa por luz de Check Engine encendida. Se conectará scanner para obtener códigos de falla.' },
      { timestamp: '2024-07-25T11:00:00Z', technician: 'Ricardo Milos', entry: 'Código P0420 detectado. Se genera cotización para cambio de catalizador.' },
    ],
    parts: [],
    laborHours: 1,
  },
   {
    id: 'OT-2024-005',
    clientId: 'C001',
    vehicleId: 'V005',
    service: 'Servicio de 5.000km',
    type: 'Mantención Preventiva',
    status: 'Completado',
    technician: 'Pedro Pascal',
    entryDate: '2024-07-28T11:00:00Z',
    completionDate: '2024-07-28T16:00:00Z',
    serviceLog: [
      { timestamp: '2024-07-28T11:05:00Z', technician: 'Pedro Pascal', entry: 'Revisión inicial, mantención básica de 5.000km.' },
    ],
    parts: [],
    laborHours: 2,
    finalReport: "Se realizó chequeo básico de 5.000km. No se observan fugas ni fallas. Niveles y presiones correctos. El vehículo se encuentra en óptimas condiciones."
  },
];

export const calendarEvents: CalendarEvent[] = [
    { id: 'E001', start: '2024-07-26T09:00:00', end: '2024-07-26T11:00:00', title: 'OT-2024-005: Mantención 20.000km', vehicle: 'ZZ-YY-99', technician: 'Pedro Pascal', workstation: 1 },
    { id: 'E002', start: '2024-07-26T10:00:00', end: '2024-07-26T12:00:00', title: 'Diagnóstico', vehicle: 'XW-VU-87', technician: 'Ricardo Milos', workstation: 2 },
    { id: 'E003', start: '2024-07-26T11:30:00', end: '2024-07-26T13:00:00', title: 'Rotación Neumáticos', vehicle: 'AB-CD-12', technician: 'Pedro Pascal', workstation: 1 },
    { id: 'E004', start: '2024-07-26T14:00:00', end: '2024-07-26T17:00:00', title: 'Ajuste de Motor', vehicle: 'PQ-RS-34', technician: 'Ricardo Milos', workstation: 3 },
  ];

export const quotes: Quote[] = [
  {
    id: 'COT-2024-001',
    clientId: 'C002',
    vehicleId: 'V002',
    date: '2024-07-21T10:00:00Z',
    items: [
      { description: 'Cambio de pastillas de freno delanteras', quantity: 1, unitPrice: 80000, total: 80000 },
      { description: 'Rectificación de discos delanteros', quantity: 2, unitPrice: 15000, total: 30000 },
      { description: 'Mano de obra', quantity: 2, unitPrice: 25000, total: 50000 },
    ],
    total: 160000,
    status: 'Aprobada',
  },
  {
    id: 'COT-2024-002',
    clientId: 'C003',
    vehicleId: 'V003',
    date: '2024-07-23T11:30:00Z',
    items: [
      { description: 'Cambio de compresor de A/C', quantity: 1, unitPrice: 250000, total: 250000 },
      { description: 'Carga de gas refrigerante', quantity: 1, unitPrice: 40000, total: 40000 },
      { description: 'Mano de obra', quantity: 3, unitPrice: 25000, total: 75000 },
    ],
    total: 365000,
    status: 'Enviada',
  },
    {
    id: 'COT-2024-003',
    clientId: 'C001',
    vehicleId: 'V001',
    date: '2024-07-25T15:00:00Z',
    items: [
      { description: 'Cambio de neumáticos (4)', quantity: 4, unitPrice: 75000, total: 300000 },
      { description: 'Alineación y balanceo', quantity: 1, unitPrice: 35000, total: 35000 },
    ],
    total: 335000,
    status: 'Rechazada',
  },
];


export const fleetContracts: FleetContract[] = [
    { id: "CON-001", companyName: "Transportes Andinos Ltda.", vehicleCount: 15, planType: "Premium", status: "Activo", startDate: "2024-01-01", endDate: "2024-12-31" },
    { id: "CON-002", companyName: "Minería del Norte S.A.", vehicleCount: 32, planType: "Básico", status: "Activo", startDate: "2024-03-01", endDate: "2025-02-28" },
    { id: "CON-003", companyName: "Constructora del Pacífico", vehicleCount: 8, planType: "Personalizado", status: "Vencido", startDate: "2023-05-01", endDate: "2024-04-30" },
];

export const maintenancePlans: MaintenancePlan[] = [
    {
        id: "PLAN-001",
        name: "Plan Básico - 10.000km",
        description: "Revisión estándar para vehículos con bajo kilometraje.",
        tasks: [
            { description: "Cambio de aceite y filtro." },
            { description: "Revisión de niveles (refrigerante, frenos, limpiaparabrisas)." },
            { description: "Inspección de presión de neumáticos." },
        ]
    },
    {
        id: "PLAN-002",
        name: "Plan Premium - 40.000km",
        description: "Mantención completa para asegurar el óptimo funcionamiento del vehículo.",
        tasks: [
            { description: "Cambio de aceite y filtro." },
            { description: "Cambio de filtro de aire y de cabina." },
            { description: "Rotación y balanceo de neumáticos." },
            { description: "Inspección completa de sistema de frenos." },
            { description: "Revisión de correas y mangueras." },
        ]
    }
];

export const technicians: Technician[] = [
    {
        id: "TECH-001",
        name: "Pedro Pascal",
        avatarUrl: "/avatars/pedro.png",
        specialties: ["Motores Diesel", "Electrónica Avanzada", "Transmisiones Automáticas"],
        hireDate: "2020-03-15",
        contact: "+56911112222",
        baseSalary: 1200000,
        extraHourRate: 8000,
        extraHoursThisMonth: 12,
        maxExtraHours: 20
    },
    {
        id: "TECH-002",
        name: "Ricardo Milos",
        avatarUrl: "/avatars/ricardo.png",
        specialties: ["Frenos ABS", "Suspensiones", "Aire Acondicionado"],
        hireDate: "2021-08-01",
        contact: "+56933334444",
        baseSalary: 950000,
        extraHourRate: 7000,
        extraHoursThisMonth: 5,
        maxExtraHours: 25
    },
    {
        id: "TECH-003",
        name: "Otro Técnico",
        avatarUrl: "/avatars/otro.png",
        specialties: ["Mecánica General"],
        hireDate: "2023-01-10",
        contact: "+56955556666",
        baseSalary: 800000,
        extraHourRate: 6500,
        extraHoursThisMonth: 0,
        maxExtraHours: 15
    }
];
