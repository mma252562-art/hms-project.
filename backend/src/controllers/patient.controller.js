const service = require('../services/patient.service');

const getAll = async (req, res, next) => {
  try {
    const result = await service.getAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const patient = await service.getById(req.params.id);
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const patient = await service.create(req.body);
    res.status(201).json({ success: true, message: 'Patient created', data: patient });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const patient = await service.update(req.params.id, req.body);
    res.json({ success: true, message: 'Patient updated', data: patient });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
