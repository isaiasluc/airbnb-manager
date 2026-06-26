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
    toggleEmailSent,
    handleSendEmail,
    changeStatus,
    changeHostServiceStatus,
    remove,
  }
}
