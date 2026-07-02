const express = require('express');
const router = express.Router();
const store = require('../models/store');

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: List all vendors
 *     description: Returns all available vendors that can be assigned to purchase orders.
 *     responses:
 *       200:
 *         description: Array of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 */
router.get('/', (req, res, next) => {
  try {
    const vendors = store.getVendors();
    res.json(vendors);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
