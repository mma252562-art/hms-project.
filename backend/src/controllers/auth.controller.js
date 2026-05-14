const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'User registered successfully', data: result });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message || 'Invalid credentials' });
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

module.exports = { register, login, getProfile, getAllUsers };
