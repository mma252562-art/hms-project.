const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

const getAll = async ({ search, specialization, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(specialization && { specializationId: specialization }),
    ...(search && {
      OR: [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { specialization: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true } },
        specialization: true,
        schedules: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.doctor.count({ where }),
  ]);

  return { doctors, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const doctorId = parseInt(id);
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      specialization: true,
      schedules: true,
      appointments: {
        include: { patient: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!doctor) throw new Error('Doctor not found');
  return doctor;
};

const create = async ({ email, password, firstName, lastName, phone, specializationId, licenseNumber, experience, consultationFee, bio }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password || 'doctor123', 12);

  return prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      phone,
      role: 'DOCTOR',
      doctor: {
        create: {
          specializationId: parseInt(specializationId),
          licenseNumber,
          experience: parseInt(experience) || 0,
          consultationFee: parseFloat(consultationFee) || 0,
          bio,
        },
      },
    },
    include: { doctor: { include: { specialization: true } } },
  });
};

const update = async (id, { firstName, lastName, phone, specializationId, experience, consultationFee, bio, isAvailable }) => {
  const doctorId = parseInt(id);
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { user: true } });
  if (!doctor) throw new Error('Doctor not found');

  // Only update user fields that are provided
  const userUpdate = {};
  if (firstName !== undefined) userUpdate.firstName = firstName;
  if (lastName !== undefined) userUpdate.lastName = lastName;
  if (phone !== undefined) userUpdate.phone = phone;
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id: doctor.userId }, data: userUpdate });
  }

  // Only update doctor fields that are provided
  const doctorUpdate = {};
  if (specializationId !== undefined) doctorUpdate.specializationId = parseInt(specializationId);
  if (experience !== undefined) doctorUpdate.experience = parseInt(experience) || 0;
  if (consultationFee !== undefined) doctorUpdate.consultationFee = parseFloat(consultationFee) || 0;
  if (bio !== undefined) doctorUpdate.bio = bio;
  if (isAvailable !== undefined) doctorUpdate.isAvailable = isAvailable;

  return prisma.doctor.update({
    where: { id: doctorId },
    data: doctorUpdate,
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } }, specialization: true },
  });
};

const updateSchedule = async (id, schedules) => {
  const doctorId = parseInt(id);
  await prisma.schedule.deleteMany({ where: { doctorId } });
  await prisma.schedule.createMany({
    data: schedules.map(s => ({
      doctorId,
      dayOfWeek: parseInt(s.dayOfWeek),
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: parseInt(s.slotDuration) || 30,
      isActive: s.isActive !== false,
    })),
  });
  return prisma.schedule.findMany({ where: { doctorId } });
};

const getSpecializations = async () => prisma.specialization.findMany({ orderBy: { name: 'asc' } });

const createSpecialization = async ({ name, description }) => {
  return prisma.specialization.create({ data: { name, description } });
};

module.exports = { getAll, getById, create, update, updateSchedule, getSpecializations, createSpecialization };
