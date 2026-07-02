const request = require('supertest');
const app = require('../src/index');
const store = require('../src/models/store');

beforeEach(() => {
  store.resetStore();
});

// Helper to create a PO
async function createTestPO(overrides = {}) {
  const defaults = {
    vendorId: 1,
    lineItems: [
      { productId: 1, qty: 10, unitPrice: 25.0 },
      { productId: 2, qty: 5, unitPrice: 50.0 },
    ],
  };
  const body = { ...defaults, ...overrides };
  const res = await request(app).post('/api/purchase-orders').send(body);
  return res;
}

describe('Products API', () => {
  test('1. GET /api/products returns seeded products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body[0]).toHaveProperty('name', 'Widget A');
    expect(res.body[0]).toHaveProperty('sku', 'WDG-001');
    expect(res.body[0]).toHaveProperty('stock', 100);
    expect(res.body[4]).toHaveProperty('name', 'Bolt Pack E');
  });
});

describe('Vendors API', () => {
  test('2. GET /api/vendors returns seeded vendors', async () => {
    const res = await request(app).get('/api/vendors');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toHaveProperty('name', 'Acme Supplies');
    expect(res.body[1]).toHaveProperty('name', 'Global Parts Co.');
    expect(res.body[2]).toHaveProperty('name', 'Prime Components');
  });
});

describe('Purchase Orders API', () => {
  test('3. POST /api/purchase-orders creates a PO with computed total', async () => {
    const res = await createTestPO();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toMatch(/^PO-/);
    expect(res.body).toHaveProperty('vendorId', 1);
    expect(res.body).toHaveProperty('status', 'draft');
    expect(res.body).toHaveProperty('total', 10 * 25 + 5 * 50); // 500
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body.lineItems).toHaveLength(2);
  });

  test('4. POST /api/purchase-orders validates required fields', async () => {
    // Missing vendorId
    let res = await request(app)
      .post('/api/purchase-orders')
      .send({ lineItems: [{ productId: 1, qty: 10, unitPrice: 5 }] });
    expect(res.status).toBe(404);

    // Missing lineItems
    res = await request(app)
      .post('/api/purchase-orders')
      .send({ vendorId: 1 });
    expect(res.status).toBe(400);

    // Empty lineItems
    res = await request(app)
      .post('/api/purchase-orders')
      .send({ vendorId: 1, lineItems: [] });
    expect(res.status).toBe(400);

    // Invalid productId
    res = await request(app)
      .post('/api/purchase-orders')
      .send({ vendorId: 1, lineItems: [{ productId: 999, qty: 1, unitPrice: 10 }] });
    expect(res.status).toBe(404);

    // qty <= 0
    res = await request(app)
      .post('/api/purchase-orders')
      .send({ vendorId: 1, lineItems: [{ productId: 1, qty: 0, unitPrice: 10 }] });
    expect(res.status).toBe(400);

    // unitPrice <= 0
    res = await request(app)
      .post('/api/purchase-orders')
      .send({ vendorId: 1, lineItems: [{ productId: 1, qty: 5, unitPrice: -1 }] });
    expect(res.status).toBe(400);
  });

  test('5. GET /api/purchase-orders/:id returns PO with line items', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    const res = await request(app).get(`/api/purchase-orders/${poId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', poId);
    expect(res.body).toHaveProperty('vendor');
    expect(res.body.vendor).toHaveProperty('name', 'Acme Supplies');
    expect(res.body.lineItems[0]).toHaveProperty('productName', 'Widget A');
    expect(res.body.lineItems[1]).toHaveProperty('productName', 'Gear B');
  });

  test('6. POST /api/purchase-orders/:id/approve moves draft to approved', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    const res = await request(app).post(`/api/purchase-orders/${poId}/approve`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'approved');
  });

  test('7. POST /api/purchase-orders/:id/approve on non-draft returns 400', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    // Approve first
    await request(app).post(`/api/purchase-orders/${poId}/approve`);

    // Try to approve again
    const res = await request(app).post(`/api/purchase-orders/${poId}/approve`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('can only be approved when in draft status');
  });

  test('8. POST /api/purchase-orders/:id/receive on approved PO updates stock', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    // Approve first
    await request(app).post(`/api/purchase-orders/${poId}/approve`);

    // Receive
    const res = await request(app).post(`/api/purchase-orders/${poId}/receive`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'received');

    // Check stock was updated
    const productsRes = await request(app).get('/api/products');
    const widget = productsRes.body.find((p) => p.id === 1);
    const gear = productsRes.body.find((p) => p.id === 2);
    expect(widget.stock).toBe(100 + 10); // initial 100 + qty 10
    expect(gear.stock).toBe(75 + 5);     // initial 75 + qty 5
  });

  test('9. POST /api/purchase-orders/:id/receive on non-approved returns 400', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    // Try to receive a draft PO
    const res = await request(app).post(`/api/purchase-orders/${poId}/receive`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('can only be received when in approved status');
  });

  test('10. Double receive returns 400 (status is already received)', async () => {
    const createRes = await createTestPO();
    const poId = createRes.body.id;

    // Approve then receive
    await request(app).post(`/api/purchase-orders/${poId}/approve`);
    await request(app).post(`/api/purchase-orders/${poId}/receive`);

    // Try to receive again
    const res = await request(app).post(`/api/purchase-orders/${poId}/receive`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('can only be received when in approved status');
  });

  test('11. Manager approval: PO > $5000 without ?role=manager returns 403', async () => {
    const res = await createTestPO({
      lineItems: [{ productId: 1, qty: 100, unitPrice: 100 }], // total = 10000
    });
    const poId = res.body.id;
    expect(res.body.total).toBe(10000);

    const approveRes = await request(app).post(`/api/purchase-orders/${poId}/approve`);
    expect(approveRes.status).toBe(403);
    expect(approveRes.body.error.message).toContain('require manager approval');
  });

  test('12. Manager approval: PO > $5000 with ?role=manager succeeds', async () => {
    const res = await createTestPO({
      lineItems: [{ productId: 1, qty: 100, unitPrice: 100 }], // total = 10000
    });
    const poId = res.body.id;

    const approveRes = await request(app)
      .post(`/api/purchase-orders/${poId}/approve?role=manager`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body).toHaveProperty('status', 'approved');
  });

  test('13. GET /api/purchase-orders/:id on non-existent returns 404', async () => {
    const res = await request(app).get('/api/purchase-orders/PO-nonexist');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('not found');
  });
});
