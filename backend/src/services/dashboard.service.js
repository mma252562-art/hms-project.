const prisma = require('../utils/prisma');

const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    todayAppointments,
    monthAppointments,
    revenue,
    pendingBills,
    recentAppointments,
    appointmentsByStatus,
  ] = await Promise.all([
    prisma.patient.count({ where: { isActive: true } }),
    prisma.doctor.count({ where: { isAvailable: true } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: today, lt: tomorrow } } }),
    prisma.appointment.count({ where: { scheduledAt: { gte: monthStart } } }),
    prisma.bill.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
    prisma.bill.count({ where: { status: 'PENDING' } }),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.appointment.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  return {
    totalPatients,
    totalDoctors,
    totalAppointments,
    todayAppointments,
    monthAppointments,
    totalRevenue: revenue._sum.total || 0,
    pendingBills,
    recentAppointments,
    appointmentsByStatus: appointmentsByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
  };
};

module.exports = { getStats };
