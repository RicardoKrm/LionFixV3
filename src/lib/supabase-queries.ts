import { supabase } from './supabase';
import type { Client, Vehicle, WorkOrder, Quote, Part, FleetContract, MaintenancePlan, CalendarEvent } from '@/types';

export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

export async function getClientByUserId(userId: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).single();
  if (error) { console.error('Error fetching client by user_id', error); return null; }
  return data;
}

export async function getVehicles(clientId?: string) {
  let query = supabase.from('vehicles').select('*, clients(name)');
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

export async function getParts() {
  const { data, error } = await supabase.from('parts').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

export async function getWorkOrders(clientId?: string) {
  let query = supabase.from('work_orders').select(`
    *,
    clients(name),
    vehicles(license_plate, make, model),
    profiles!work_orders_technician_id_fkey(name)
  `);
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

export async function getQuotes(clientId?: string) {
  let query = supabase.from('quotes').select(`
    *,
    clients(name),
    vehicles(license_plate)
  `);
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

export async function getFleetContracts(clientId?: string) {
  let query = supabase.from('fleet_contracts').select(`
    *,
    clients(name)
  `);
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

export async function getMaintenancePlans() {
  const { data, error } = await supabase.from('maintenance_plans').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

export async function getCalendarEvents() {
  const { data, error } = await supabase.from('calendar_events').select(`
    *,
    vehicles(license_plate),
    profiles(name)
  `);
  if (error) { console.error(error); return []; }
  return data;
}

export async function getTechnicians() {
  // Solo devolvemos perfiles que sean mecánicos o tengan detalles
  const { data, error } = await supabase.from('profiles').select(`
    *,
    technician_details(*)
  `).eq('role', 'mechanic');
  if (error) { console.error(error); return []; }
  return data;
}
