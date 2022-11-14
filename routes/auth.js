const express = require('express')
// Валидация поступающих данных
const { body } = require('express-validator/check')

const User = require('../models/user')
const authController = require('../controllers/auth')

const router = express.Router()

// Создание пользователя (регистрация) PUT /auth/signup
router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!')
          }
        })
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 4 }),
    body('name').trim().not().isEmpty(),
  ],
  authController.signup
)

// Авторизация POST /auth/login
router.post('/login', authController.login)

module.exports = router
