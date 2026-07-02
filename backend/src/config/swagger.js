const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SimpleGrid - Purchase Orders & Inventory API',
      version: '1.0.0',
      description:
        'REST API for managing Purchase Orders and Inventory. Part of SimpleGrid ERP — handles the core flow of raising POs to vendors, approving them, receiving goods, and tracking inventory.',
      contact: {
        name: 'SimpleGrid ERP',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Products', description: 'Product & inventory endpoints' },
      { name: 'Vendors', description: 'Vendor listing endpoints' },
      { name: 'Purchase Orders', description: 'PO lifecycle management (create, approve, receive)' },
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Widget A' },
            sku: { type: 'string', example: 'WDG-001' },
            stock: { type: 'integer', example: 100, description: 'Current stock quantity' },
          },
        },
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Acme Supplies' },
            email: { type: 'string', example: 'contact@acmesupplies.com' },
          },
        },
        LineItem: {
          type: 'object',
          properties: {
            productId: { type: 'integer', example: 1 },
            qty: { type: 'integer', example: 50, description: 'Quantity ordered' },
            unitPrice: { type: 'number', format: 'float', example: 12.5 },
          },
          required: ['productId', 'qty', 'unitPrice'],
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'PO-a1b2c3d4' },
            vendorId: { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['draft', 'approved', 'received'],
              example: 'draft',
              description: 'PO lifecycle state: draft → approved → received',
            },
            lineItems: {
              type: 'array',
              items: { $ref: '#/components/schemas/LineItem' },
            },
            total: {
              type: 'number',
              format: 'float',
              example: 625.0,
              description: 'Server-computed total (sum of qty × unitPrice)',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PurchaseOrderDetail: {
          allOf: [
            { $ref: '#/components/schemas/PurchaseOrder' },
            {
              type: 'object',
              properties: {
                vendorName: { type: 'string', example: 'Acme Supplies' },
                vendor: { $ref: '#/components/schemas/Vendor' },
                lineItems: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/LineItem' },
                      {
                        type: 'object',
                        properties: {
                          productName: { type: 'string', example: 'Widget A' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
        CreatePORequest: {
          type: 'object',
          required: ['vendorId', 'lineItems'],
          properties: {
            vendorId: { type: 'integer', example: 1, description: 'ID of the vendor' },
            lineItems: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/LineItem' },
              description: 'At least one line item is required',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Purchase order can only be approved when in draft status. Current status: approved' },
                status: { type: 'integer', example: 400 },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
