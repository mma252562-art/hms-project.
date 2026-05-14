const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Specializations
  const specs = await Promise.all([
    prisma.specialization.upsert({ where: { name: 'Cardiology' }, update: {}, create: { name: 'Cardiology', description: 'Heart and cardiovascular system' } }),
    prisma.specialization.upsert({ where: { name: 'Neurology' }, update: {}, create: { name: 'Neurology', description: 'Brain and nervous system' } }),
    prisma.specialization.upsert({ where: { name: 'Orthopedics' }, update: {}, create: { name: 'Orthopedics', description: 'Bones, joints, and muscles' } }),
    prisma.specialization.upsert({ where: { name: 'Pediatrics' }, update: {}, create: { name: 'Pediatrics', description: 'Medical care for children' } }),
    prisma.specialization.upsert({ where: { name: 'Dermatology' }, update: {}, create: { name: 'Dermatology', description: 'Skin conditions and diseases' } }),
    prisma.specialization.upsert({ where: { name: 'General Medicine' }, update: {}, create: { name: 'General Medicine', description: 'General health and wellness' } }),
  ]);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: { email: 'admin@hospital.com', password: hash('admin123'), firstName: 'System', lastName: 'Admin', role: 'ADMIN', phone: '555-0100' },
  });

  // Receptionist
  await prisma.user.upsert({
    where: { email: 'reception@hospital.com' },
    update: {},
    create: { email: 'reception@hospital.com', password: hash('recep123'), firstName: 'Sarah', lastName: 'Connor', role: 'RECEPTIONIST', phone: '555-0101' },
  });

  // Nurse
  await prisma.user.upsert({
    where: { email: 'nurse@hospital.com' },
    update: {},
    create: { email: 'nurse@hospital.com', password: hash('nurse123'), firstName: 'Mary', lastName: 'Johnson', role: 'NURSE', phone: '555-0102' },
  });

  // Doctors
  const doctorData = [
    { email: 'dr.smith@hospital.com', firstName: 'James', lastName: 'Smith', license: 'LIC-001', specIndex: 0, fee: 150, exp: 12 },
    { email: 'dr.patel@hospital.com', firstName: 'Priya', lastName: 'Patel', license: 'LIC-002', specIndex: 1, fee: 180, exp: 8 },
    { email: 'dr.chen@hospital.com', firstName: 'Wei', lastName: 'Chen', license: 'LIC-003', specIndex: 2, fee: 160, exp: 15 },
    { email: 'dr.garcia@hospital.com', firstName: 'Elena', lastName: 'Garcia', license: 'LIC-004', specIndex: 3, fee: 120, exp: 6 },
    { email: 'dr.brown@hospital.com', firstName: 'Michael', lastName: 'Brown', license: 'LIC-005', specIndex: 5, fee: 100, exp: 10 },
  ];

  const doctors = [];
  for (const d of doctorData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { email: d.email, password: hash('doctor123'), firstName: d.firstName, lastName: d.lastName, role: 'DOCTOR', phone: '555-0' + (200 + doctors.length) },
    });
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, specializationId: specs[d.specIndex].id, licenseNumber: d.license, experience: d.exp, consultationFee: d.fee, bio: `Dr. ${d.lastName} is a specialist with ${d.exp} years of experience.` },
    });
    // Add schedules Mon-Fri
    await prisma.schedule.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.schedule.createMany({
      data: [1, 2, 3, 4, 5].map(day => ({
        doctorId: doctor.id, dayOfWeek: day,
        startTime: '09:00', endTime: '17:00', slotDuration: 30,
      })),
    });
    doctors.push({ ...doctor, userId: user.id, consultationFee: d.fee });
  }

  // Patients
  const patientData = [
    { first: 'Alice', last: 'Williams', email: 'alice@email.com', phone: '555-1001', dob: '1985-03-15', gender: 'FEMALE', blood: 'A+', address: '123 Oak St' },
    { first: 'Bob', last: 'Martinez', email: 'bob@email.com', phone: '555-1002', dob: '1972-07-22', gender: 'MALE', blood: 'O-', address: '456 Pine Ave' },
    { first: 'Carol', last: 'Davis', email: 'carol@email.com', phone: '555-1003', dob: '1990-11-08', gender: 'FEMALE', blood: 'B+', address: '789 Elm Rd' },
    { first: 'David', last: 'Wilson', email: 'david@email.com', phone: '555-1004', dob: '1965-01-30', gender: 'MALE', blood: 'AB+', address: '321 Maple Dr' },
    { first: 'Emma', last: 'Taylor', email: 'emma@email.com', phone: '555-1005', dob: '1998-06-14', gender: 'FEMALE', blood: 'O+', address: '654 Cedar Ln' },
    { first: 'Frank', last: 'Anderson', email: 'frank@email.com', phone: '555-1006', dob: '1955-09-25', gender: 'MALE', blood: 'A-', address: '987 Birch Ct' },
    { first: 'Grace', last: 'Thomas', email: 'grace@email.com', phone: '555-1007', dob: '2001-12-03', gender: 'FEMALE', blood: 'B-', address: '147 Willow Way' },
    { first: 'Henry', last: 'Jackson', email: 'henry@email.com', phone: '555-1008', dob: '1979-04-18', gender: 'MALE', blood: 'O+', address: '258 Ash Blvd' },
  ];

  const patients = [];
  for (const p of patientData) {
    const patient = await prisma.patient.upsert({
      where: { email: p.email },
      update: {},
      create: { firstName: p.first, lastName: p.last, email: p.email, phone: p.phone, dateOfBirth: new Date(p.dob), gender: p.gender, bloodGroup: p.blood, address: p.address, emergencyContact: 'Emergency Contact', emergencyPhone: '555-9999' },
    });
    patients.push(patient);
  }

  // Appointments
  const now = new Date();
  const apptData = [
    { patientIdx: 0, doctorIdx: 0, daysOffset: -5, status: 'COMPLETED', reason: 'Chest pain consultation', diagnosis: 'Mild angina', prescription: 'Aspirin 75mg daily' },
    { patientIdx: 1, doctorIdx: 1, daysOffset: -3, status: 'COMPLETED', reason: 'Headaches', diagnosis: 'Tension headache', prescription: 'Ibuprofen 400mg' },
    { patientIdx: 2, doctorIdx: 2, daysOffset: -1, status: 'COMPLETED', reason: 'Knee pain', diagnosis: 'Osteoarthritis', prescription: 'Physical therapy' },
    { patientIdx: 3, doctorIdx: 4, daysOffset: 1, status: 'SCHEDULED', reason: 'Annual checkup' },
    { patientIdx: 4, doctorIdx: 0, daysOffset: 2, status: 'CONFIRMED', reason: 'Follow-up' },
    { patientIdx: 5, doctorIdx: 3, daysOffset: 3, status: 'SCHEDULED', reason: 'Skin rash' },
    { patientIdx: 6, doctorIdx: 1, daysOffset: 5, status: 'SCHEDULED', reason: 'Dizziness episodes' },
    { patientIdx: 7, doctorIdx: 4, daysOffset: -7, status: 'COMPLETED', reason: 'Fever and fatigue', diagnosis: 'Viral infection', prescription: 'Rest and fluids' },
  ];

  const appointments = [];
  for (const a of apptData) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + a.daysOffset);
    scheduledAt.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    const appt = await prisma.appointment.create({
      data: {
        patientId: patients[a.patientIdx].id,
        doctorId: doctors[a.doctorIdx].id,
        scheduledAt,
        status: a.status,
        reason: a.reason,
        diagnosis: a.diagnosis,
        prescription: a.prescription,
        duration: 30,
      },
    });
    appointments.push(appt);
  }

  // Bills for completed appointments
  const completedAppts = apptData.map((a, i) => ({ ...a, appt: appointments[i] })).filter(a => a.status === 'COMPLETED');
  for (const ca of completedAppts) {
    const doctor = doctors[ca.doctorIdx];
    const consultFee = parseFloat(doctor.consultationFee || 100);
    const labFee = Math.random() > 0.5 ? 50 : 0;
    const medFee = Math.random() > 0.3 ? 30 : 0;
    const subtotal = consultFee + labFee + medFee;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const bill = await prisma.bill.create({
      data: {
        patientId: patients[ca.patientIdx].id,
        appointmentId: ca.appt.id,
        subtotal,
        tax,
        discount: 0,
        total,
        status: 'PAID',
        paidAt: ca.appt.scheduledAt,
        items: {
          create: [
            { description: 'Consultation Fee', quantity: 1, unitPrice: consultFee, total: consultFee },
            ...(labFee > 0 ? [{ description: 'Laboratory Tests', quantity: 1, unitPrice: labFee, total: labFee }] : []),
            ...(medFee > 0 ? [{ description: 'Medications', quantity: 1, unitPrice: medFee, total: medFee }] : []),
          ],
        },
      },
    });
  }

  // Pending bill
  await prisma.bill.create({
    data: {
      patientId: patients[3].id,
      subtotal: 100,
      tax: 10,
      discount: 0,
      total: 110,
      status: 'PENDING',
      items: { create: [{ description: 'Consultation Fee', quantity: 1, unitPrice: 100, total: 100 }] },
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('Admin:        admin@hospital.com     / admin123');
  console.log('Receptionist: reception@hospital.com / recep123');
  console.log('Nurse:        nurse@hospital.com     / nurse123');
  console.log('Doctor:       dr.smith@hospital.com  / doctor123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
