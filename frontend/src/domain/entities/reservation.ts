export interface Guest {
  id: number
  first_name: string
  last_name: string
}

export interface Reservation {
  id: number
  confirmation_code: string
  guest_id: number
  guest_first_name: string
  guest_last_name: string
  checkin_at: string
  checkout_at: string
  guests_count: number
  host_payout: number
  host_service_fee: number
  host_service_status: 'pending' | 'paid' | 'cancelled'
  currency: string
  source_email_id: string
  email_sent: boolean
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

export type ReservationStatus = Reservation['status']
export type HostServiceStatus = Reservation['host_service_status']
