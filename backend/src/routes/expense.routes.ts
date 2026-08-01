import { Router } from 'express'
import * as ExpenseController from '../controllers/expense.controller'

const router = Router()

router.get('/',        ExpenseController.list)
router.get('/summary', ExpenseController.summary)
router.get('/:id',     ExpenseController.getOne)
router.post('/',       ExpenseController.create)
router.patch('/:id',   ExpenseController.update)
router.delete('/:id',  ExpenseController.remove)

export default router
