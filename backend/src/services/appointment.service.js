const prisma = require('../utils/prisma');

const INCLUDE = {
  patient: { select: { id: true, firstName: true, lastName: true, phone: true, patientId: true } },
  doctor: {
    include: {
      user: { select: { firstName: true, lastName: true } },
      specialization: { select: { name: true } },
    },
  },
};

const getAll = async ({ search, status, doctorId, patientId, date, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(doctorId && { doctorId }),
    ...(patientId && { patientId }),
    ...(date && {
      scheduledAt: {
        gte: new Date(date + 'T00:00:00'),
        lte: new Date(date + 'T23:59:59'),
      },
    }),
    ...(search && {
      OR: [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { appointmentId: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({ where, skip, take: parseInt(limit), include: INCLUDE, orderBy: { scheduledAt: 'desc' } }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { ...INCLUDE, bill: true } });
  if (!appt) throw new Error('Appointment not found');
  return appt;
};

const create = async (data) => {
  const { patientId, doctorId, scheduledAt, reason, notes, duration } = data;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || !patient.isActive) throw new Error('Patient not found or inactive');

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new Error('Doctor not found');

  return prisma.appointment.create({
    data: { patientId, doctorId, scheduledAt: new Date(scheduledAt), reason, notes, duration: parseInt(duration) || 30 },
    include: INCLUDE,
  });
};

const update = async (id, data) => {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new Error('Appointment not found');
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
  if (data.duration !== undefined) data.duration = parseInt(data.duration) || 30;
  // Strip fields that shouldn't be sent to Prisma update
  const { id: _id, appointmentId: _aid, createdAt: _c, updatedAt: _u,
          patient: _p, doctor: _d, bill: _b, ...safeData } = data;
  return prisma.appointment.update({ where: { id }, data: safeData, include: INCLUDE });
};

const cancel = async (id) => {
  return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' }, include: INCLUDE });
};

const getUpcoming = async () => {
  return prisma.appointment.findMany({
    where: { scheduledAt: { gte: new Date() }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
    include: INCLUDE,
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  });
};

module.exports = { getAll, getById, create, update, cancel, getUpcoming };
