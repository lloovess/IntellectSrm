import { expect, test } from '@playwright/test';

test('rbac denies forbidden role and allows permitted role on students write', async ({ request }) => {
  const forbidden = await request.post('/api/students', {
    headers: { 'x-role': 'call_center', 'Content-Type': 'application/json' },
    data: { fullName: 'RBAC Forbidden', phone: '+7 700 000 00 09' }
  });

  expect(forbidden.status()).toBe(403);

  const allowed = await request.post('/api/students', {
    headers: { 'x-role': 'assistant', 'Content-Type': 'application/json' },
    data: { fullName: `RBAC Allowed ${Date.now()}`, phone: '+7 700 000 00 08' }
  });

  expect(allowed.status()).toBe(201);
});

test('rbac blocks non-finance roles for finance mutations', async ({ request }) => {
  const contractForbidden = await request.post('/api/contracts', {
    headers: { 'x-role': 'call_center', 'Content-Type': 'application/json' },
    data: {
      enrollmentId: 'dummy',
      basePrice: 100000,
      discountAmount: 0,
      prepaymentAmount: 10000,
      paymentMode: 'monthly',
      startedAt: '2026-09-01'
    }
  });

  expect(contractForbidden.status()).toBe(403);

  const withdrawalForbidden = await request.post('/api/withdrawals', {
    headers: { 'x-role': 'assistant', 'Content-Type': 'application/json' },
    data: {
      enrollmentId: 'dummy',
      reason: 'Тест',
      effectiveDate: '2026-10-01',
      settlementType: 'debt',
      settlementAmount: 10000
    }
  });

  expect(withdrawalForbidden.status()).toBe(403);
});
