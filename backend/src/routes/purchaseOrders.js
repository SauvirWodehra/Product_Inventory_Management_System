const express = require('express');
const router = express.Router();
const store = require('../models/store');
const poService = require('../services/poService');

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: List all purchase orders
 *     description: Returns all POs with their current status and vendor name. Results are sorted by creation date (newest first).
 *     responses:
 *       200:
 *         description: Array of purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseOrder'
 */
router.get('/', (req, res, next) => {
  try {
    const pos = store.getPurchaseOrders();
    const result = pos.map((po) => {
      const vendor = store.getVendorById(po.vendorId);
      return {
        ...po,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
      };
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Create a new purchase order
 *     description: |
 *       Creates a new PO in **draft** status. The server computes the total from line items (qty × unitPrice).
 *       The client must NOT send a total — it is always calculated server-side.
 *
 *       **Validations:**
 *       - vendorId must reference an existing vendor
 *       - At least one line item is required
 *       - Each line item must have a valid productId, qty > 0, and unitPrice > 0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePORequest'
 *           example:
 *             vendorId: 1
 *             lineItems:
 *               - productId: 1
 *                 qty: 50
 *                 unitPrice: 12.50
 *               - productId: 3
 *                 qty: 100
 *                 unitPrice: 5.00
 *     responses:
 *       201:
 *         description: PO created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error (missing fields, invalid values)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Vendor or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res, next) => {
  try {
    const { vendorId, lineItems } = req.body;
    const po = poService.createPO(vendorId, lineItems);
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get a single purchase order by ID
 *     description: Returns the full PO details including enriched line items (with product names) and vendor information.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID (e.g., PO-a1b2c3d4)
 *         example: PO-a1b2c3d4
 *     responses:
 *       200:
 *         description: Purchase order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderDetail'
 *       404:
 *         description: Purchase order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', (req, res, next) => {
  try {
    const po = store.getPurchaseOrderById(req.params.id);
    if (!po) {
      const err = new poService.AppError(`Purchase order ${req.params.id} not found`, 404);
      throw err;
    }

    const vendor = store.getVendorById(po.vendorId);

    const enrichedLineItems = po.lineItems.map((item) => {
      const product = store.getProductById(item.productId);
      return {
        ...item,
        productName: product ? product.name : 'Unknown Product',
      };
    });

    const result = {
      ...po,
      lineItems: enrichedLineItems,
      vendor: vendor ? { id: vendor.id, name: vendor.name, email: vendor.email } : null,
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/purchase-orders/{id}/approve:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Approve a draft purchase order
 *     description: |
 *       Moves a PO from **draft** → **approved** status.
 *
 *       **Business Rules:**
 *       - Only POs in `draft` status can be approved (400 otherwise)
 *       - POs with total > $5,000 require `?role=manager` query parameter (403 otherwise)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *         example: PO-a1b2c3d4
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [manager]
 *         description: Required for POs exceeding $5,000. Set to "manager" to authorize high-value approvals.
 *     responses:
 *       200:
 *         description: PO approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: PO is not in draft status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "Purchase order can only be approved when in draft status. Current status: approved"
 *                 status: 400
 *       403:
 *         description: Manager role required for high-value POs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "Purchase orders exceeding $5,000 require manager approval. Please use ?role=manager"
 *                 status: 403
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/approve', (req, res, next) => {
  try {
    const role = req.query.role || null;
    const po = poService.approvePO(req.params.id, role);
    res.json(po);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Receive goods for an approved purchase order
 *     description: |
 *       Moves a PO from **approved** → **received** status and **updates product inventory**.
 *
 *       **Business Rules:**
 *       - Only POs in `approved` status can be received (400 otherwise)
 *       - Stock for each product in the line items increases by the ordered quantity
 *       - Calling receive on an already-received PO returns 400 (double-receive protection)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *         example: PO-a1b2c3d4
 *     responses:
 *       200:
 *         description: PO received, inventory updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: PO is not in approved status (e.g., still draft or already received)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "Purchase order can only be received when in approved status. Current status: received"
 *                 status: 400
 *       404:
 *         description: Purchase order not found
 */
router.post('/:id/receive', (req, res, next) => {
  try {
    const po = poService.receivePO(req.params.id);
    res.json(po);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
