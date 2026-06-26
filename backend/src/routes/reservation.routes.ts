import { Router } from 'express'
import * as ReservationController from '../controllers/reservation.controller'

const router = Router()

router.get('/',        ReservationController.list)
router.get('/export',  ReservationController.exportCsv)
router.get('/occupancy', ReservationController.occupancy)
router.get('/calendar', ReservationController.calendar)
router.get('/:id',     ReservationController.getOne)
router.post('/',       ReservationController.create)
router.post('/:id/send-email', ReservationController.sendEmail)
router.patch('/:id',   ReservationController.update)
router.delete('/:id',  ReservationController.remove)

export default router
