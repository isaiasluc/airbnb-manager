import { Router } from 'express'
import * as ReservationController from '../controllers/reservation.controller'

const router = Router()

router.get('/',        ReservationController.list)
router.get('/:id',     ReservationController.getOne)
router.post('/',       ReservationController.create)
router.patch('/:id',   ReservationController.update)
router.delete('/:id',  ReservationController.remove)

export default router