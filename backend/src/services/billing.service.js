const prisma = require('../utils/prisma');

const INCLUDE = {
  patient: { select: { id: true, firstName: true, lastName: true, patientId: true, phone: true } },
  appointment: {
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  },
  items: true,
};

const getAll = async ({ status, patientId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(patientId && { patientId }),
  };

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({ where, skip, take: parseInt(limit), include: INCLUDE, orderBy: { createdAt: 'desc' } }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const bill = await prisma.bill.findUnique({ where: { id }, include: INCLUDE });
  if (!bill) throw new Error('Bill not found');
  return bill;
};

const create = async ({ patientId, appointmentId, items, discount = 0, tax = 0, notes }) => {
  if (!items || items.length === 0) throw new Error('At least one line item is required');
  const validItems = items.filter(i => i.description && i.unitPrice > 0);
  if (validItems.length === 0) throw new Error('All items must have a description and price');

  const subtotal = validItems.reduce((sum, i) => sum + parseFloat(i.unitPrice) * parseInt(i.quantity || 1), 0);
  const discountAmt = parseFloat(discount) || 0;
  const taxAmt = parseFloat(tax) || 0;
  const total = subtotal - discountAmt + taxAmt;

  return prisma.bill.create({
    data: {
      patientId,
      appointmentId: appointmentId || null,
      subtotal,
      tax: taxAmt,
      discount: discountAmt,
      total,
      notes,
      items: {
        create: validItems.map(i => ({
          description: i.description,
          quantity: parseInt(i.quantity) || 1,
          unitPrice: parseFloat(i.unitPrice),
          total: parseFloat(i.unitPrice) * (parseInt(i.quantity) || 1),
        })),
      },
    },
    include: INCLUDE,
  });
};

const updateStatus = async (id, { status }) => {
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new Error('Bill not found');
  return prisma.bill.update({
    where: { id },
    data: { status, paidAt: status === 'PAID' ? new Date() : bill.paidAt },
    include: INCLUDE,
  });
};

const getRevenueSummary = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [totalRevenue, pending, recentPaidBills] = await Promise.all([
    prisma.bill.aggregate({ where: { status: 'PAID' }, _sum: { total: true }, _count: true }),
    prisma.bill.aggregate({ where: { status: 'PENDING' }, _sum: { total: true }, _count: true }),
    prisma.bill.findMany({
      where: { status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.total || 0,
    totalPaidCount: totalRevenue._count || 0,
    pendingRevenue: pending._sum.total || 0,
    pendingCount: pending._count || 0,
    recentPaidBills,
  };
};

module.exports = { getAll, getById, create, updateStatus, getRevenueSummary };
