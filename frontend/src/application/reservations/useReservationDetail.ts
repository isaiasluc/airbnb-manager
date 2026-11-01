import { useEffect, useState } from 'react'
import type { Reservation } from '@/domain/entities/reservation'
import {
  deleteReservation,
  fetchReservation,
  sendReservationEmail,
  updateReservation,
} from '@/infrastructure/reservations/reservationApi'

export function useReservationDetail(id: string | undefined) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [payoutReviewError, setPayoutReviewError] = useState<string | null>(null)

  useEffect(() => {
    fetchReservation(Number(id))
      .then(setReservation)
      .finally(() => setLoading(false))
  }, [id])

  async function patch(
    data: Parameters<typeof updateReservation>[1],
  ) {
    if (!reservation) return
    setSaving(true)
    try {
      const updated = await updateReservation(reservation.id, data)
      setReservation(updated)
    } finally {
      setSaving(false)
    }
  }

  /** Edição manual de datas, hóspedes e payout. Retorna true se salvou. */
  async function saveDetails(
    data: Pick<
      Parameters<typeof updateReservation>[1],
      'checkin_at' | 'checkout_at' | 'guests_count' | 'host_payout'
    >,
  ): Promise<boolean> {
    setEditError(null)
    try {
      await patch(data)
      return true
    } catch (error) {
      setEditError((error as Error).message)
      return false
    }
  }

  function clearEditError() {
    setEditError(null)
  }

  async function dismissPayoutReview() {
    setPayoutReviewError(null)
    try {
      await patch({ payout_needs_review: false })
    } catch (error) {
      setPayoutReviewError((error as Error).message)
    }
  }

  async function toggleEmailSent() {
    if (!reservation) return
    await patch({ email_sent: !reservation.email_sent })
  }

  async function handleSendEmail() {
    if (!reservation) return
    setSendingEmail(true)
    setEmailError(null)
    try {
      await sendReservationEmail(reservation.id)
      const updated = await updateReservation(reservation.id, {
        email_sent: true,
      })
      setReservation(updated)
    } catch (error) {
      setEmailError((error as Error).message)
    } finally {
      setSendingEmail(false)
    }
  }

  function changeStatus(status: Reservation['status']) {
    return patch({ status })
  }

  function changeHostServiceStatus(
    host_service_status: Reservation['host_service_status'],
  ) {
    return patch({ host_service_status })
  }

  async function remove() {
    if (!reservation) return
    setDeleting(true)
    try {
      await deleteReservation(reservation.id)
    } finally {
      setDeleting(false)
    }
  }

  return {
    reservation,
    loading,
    saving,
    sendingEmail,
    emailError,
    deleting,
    editError,
    saveDetails,
    clearEditError,
    dismissPayoutReview,
    payoutReviewError,
    toggleEmailSent,
    handleSendEmail,
    changeStatus,
    changeHostServiceStatus,
    remove,
  }
}
