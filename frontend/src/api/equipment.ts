import apiClient from './client'

export type EquipmentType = 'tiller' | 'sprayer' | 'harvester' | 'water_pump' | 'other'
export type AvailabilityStatus = 'available' | 'requested' | 'booked'
export type RequestStatus = 'pending' | 'accepted' | 'rejected'
export interface EquipmentRequest { request_id: string; requester_id: string; requester_name: string; requester_address: string; requester_contact_number: string; message: string | null; status: RequestStatus; requested_at: string }
export interface EquipmentListing { _id: string; owner_id: string; owner_name: string; equipment_name: string; equipment_type: EquipmentType; description: string; location: string; contact_number: string | null; availability_status: AvailabilityStatus; requests: EquipmentRequest[]; created_at: string }
export interface SentEquipmentRequest { listing: EquipmentListing; request: EquipmentRequest }
export interface RequestPayload { requester_name: string; requester_address: string; requester_contact_number: string; message?: string }
const authHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token') || ''}`, 'Cache-Control': 'no-cache' })

export const browseEquipment = async (params: { equipment_type?: EquipmentType; location?: string }) => (await apiClient.get<{ listings: EquipmentListing[] }>('/api/equipment/browse', { params: { ...params, _: Date.now() } })).data.listings
export const getMyListings = async () => (await apiClient.get<{ listings: EquipmentListing[] }>('/api/equipment/my-listings', { headers: authHeaders(), params: { _: Date.now() } })).data.listings
export const getMyRequests = async () => (await apiClient.get<{ listings: EquipmentListing[] }>('/api/equipment/my-requests', { headers: authHeaders(), params: { _: Date.now() } })).data.listings
export const getMyRequestsSent = async () => (await apiClient.get<{ requests: SentEquipmentRequest[] }>('/api/equipment/my-requests-sent', { headers: authHeaders(), params: { _: Date.now() } })).data.requests
export const createEquipmentListing = async (data: Pick<EquipmentListing, 'equipment_name' | 'equipment_type' | 'description' | 'location' | 'contact_number'>) => (await apiClient.post<{ listing: EquipmentListing }>('/api/equipment/list', data, { headers: authHeaders() })).data.listing
export const requestEquipment = async ({ id, data }: { id: string; data: RequestPayload }) => (await apiClient.post<{ listing: EquipmentListing }>(`/api/equipment/${id}/request`, data, { headers: authHeaders() })).data.listing
export const reviewEquipmentRequest = async ({ listingId, requestId, action }: { listingId: string; requestId: string; action: 'accept' | 'reject' }) => (await apiClient.post<{ listing: EquipmentListing }>(`/api/equipment/${listingId}/requests/${requestId}/${action}`, {}, { headers: authHeaders() })).data.listing
