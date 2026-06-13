const express = require('express');
const router = express.Router();
const { validateDiscount, getApplicableDiscounts, getAllDiscounts, createDiscount, updateDiscount, deleteDiscount } = require('../controllers/discount');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/discounts/applicable', isAuthenticatedUser, getApplicableDiscounts);
router.post('/discounts/validate', isAuthenticatedUser, validateDiscount);
router.get('/discounts', isAdmin, getAllDiscounts);
router.post('/discounts', isAdmin, createDiscount);
router.put('/discounts/:id', isAdmin, updateDiscount);
router.delete('/discounts/:id', isAdmin, deleteDiscount);

module.exports = router;
