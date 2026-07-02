const express = require('express');
const router = express.Router();
const store = require('../models/store');

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products with current stock
 *     description: Returns the full product catalog with live inventory levels. Stock changes in real time as POs are received.
 *     responses:
 *       200:
 *         description: Array of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', (req, res, next) => {
  try {
    const products = store.getProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
