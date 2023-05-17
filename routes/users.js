const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

userSchema.pre('save', async function(next) {
  const usuario = this;
  if (!usuario.isModified('password')) return next();

  try {
    const hash = await bcrypt.hash(usuario.password, 10);
    usuario.password = hash;
    next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
  const users = await User.find();
  res.render('index', { users });
});

router.post('/', [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('El email no es válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const newUser = new User({
    name: name,
    email: email,
    password: password
  });

  await newUser.save();
  res.redirect('/users');
});

router.get('/edit/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render('partials/edit', { user });
});

router.post('/update/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/users');
});

router.get('/delete/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/users');
});

module.exports = router;
