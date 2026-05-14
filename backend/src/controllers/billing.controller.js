const service = require('../services/billing.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getAll(req.query) }); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getById(req.params.id) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Bill created', data: await service.create(req.body) }); } catch (err) { next(err); }
};
const updateStatus = async (req, res, next) => {
  try { res.json({ success: true, message: 'Bill updated', data: await service.updateStatus(req.params.id, req.body) }); } catch (err) { next(err); }
};
const getRevenueSummary = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getRevenueSummary() }); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateStatus, getRevenueSummary };
