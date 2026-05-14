const service = require('../services/doctor.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getAll(req.query) }); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getById(req.params.id) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Doctor created', data: await service.create(req.body) }); } catch (err) { next(err); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, message: 'Doctor updated', data: await service.update(req.params.id, req.body) }); } catch (err) { next(err); }
};
const updateSchedule = async (req, res, next) => {
  try { res.json({ success: true, data: await service.updateSchedule(req.params.id, req.body.schedules) }); } catch (err) { next(err); }
};
const getSpecializations = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getSpecializations() }); } catch (err) { next(err); }
};
const createSpecialization = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.createSpecialization(req.body) }); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateSchedule, getSpecializations, createSpecialization };
