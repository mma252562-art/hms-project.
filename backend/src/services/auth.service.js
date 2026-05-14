const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const register = async ({ email, password, firstName, lastName, role, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const allowedRoles = ['ADMIN', 'NURSE', 'RECEPTIONIST'];
  const assignedRole = allowedRoles.includes(role) ? role : 'RECEPTIONIST';
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, role: assignedRole, phone },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  const token = generateToken(user.id, user.role);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = generateToken(user.id, user.role);
  const { password: _, ...safeUser } = user;

  // If doctor, include doctor info
  let doctorInfo = null;
  if (user.role === 'DOCTOR') {
    doctorInfo = await prisma.doctor.findUnique({
      where: { userId: user.id },
      include: { specialization: true },
    });
  }

  return { user: { ...safeUser, doctor: doctorInfo }, token };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, createdAt: true },
  });
  if (!user) throw new Error('User not found');
  return user;
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = { register, login, getProfile, getAllUsers };
