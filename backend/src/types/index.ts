export interface Guest {
  id: number
  first_name: string
  last_name: string
  created_at: Date
  updated_at: Date
}

export interface Reservation {
  id: number
  confirmation_code: string
  guest_id: number
  listing_name: string
  checkin_at: Date
  checkout_at: Date
  guests_count: number
  host_payout: number
  currency: string
  source_email_id: string
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: Date
  updated_at: Date
}

// Usado no POST /reservations e no GmailService
export type CreateReservationInput = {
  guest: {
    first_name: string
    last_name: string
  }
  confirmation_code: string
  listing_name: string
  checkin_at: Date
  checkout_at: Date
  guests_count: number
  host_payout: number
  currency?: string
  source_email_id: string
}

// Retorno enriquecido para o frontend
export interface ReservationWithGuest extends Reservation {
  guest_first_name: string
  guest_last_name: string
}