const service = require('../services/appointment.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getAll(req.query) }); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getById(req.params.id) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Appointment booked', data: await service.create(req.body) }); } catch (err) { next(err); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, message: 'Appointment updated', data: await service.update(req.params.id, req.body) }); } catch (err) { next(err); }
};
const cancel = async (req, res, next) => {
  try { res.json({ success: true, message: 'Appointment cancelled', data: await service.cancel(req.params.id) }); } catch (err) { next(err); }
};
const getUpcoming = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getUpcoming() }); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, cancel, getUpcoming };
