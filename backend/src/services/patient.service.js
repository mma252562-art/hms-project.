const prisma = require('../utils/prisma');

const getAll = async ({ search, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { patientId: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { appointments: true, bills: true } } },
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id }, { patientId: id }], isActive: true },
    include: {
      appointments: {
        include: { doctor: { include: { user: { select: { firstName: true, lastName: true } }, specialization: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      },
      bills: { orderBy: { createdAt: 'desc' }, take: 10, include: { items: true } },
    },
  });
  if (!patient) throw new Error('Patient not found');
  return patient;
};

const create = async (data) => {
  return prisma.patient.create({ data: { ...data, dateOfBirth: new Date(data.dateOfBirth) } });
};

const update = async (id, data) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient || !patient.isActive) throw new Error('Patient not found');
  if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
  // Remove fields that shouldn't be updated directly
  const { id: _id, patientId: _pid, createdAt: _c, ...safeData } = data;
  return prisma.patient.update({ where: { id }, data: safeData });
};

const remove = async (id) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) throw new Error('Patient not found');
  return prisma.patient.update({ where: { id }, data: { isActive: false } });
};

module.exports = { getAll, getById, create, update, remove };
