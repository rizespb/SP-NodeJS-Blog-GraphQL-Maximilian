// Валидация
const { validationResult } = require('express-validator/check')

// Хэширование пароля
const bcrypt = require('bcryptjs')

const jwt = require('jsonwebtoken')

const User = require('../models/user')

// Регистрация (создание пользователя)
exports.signup = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }

  const email = req.body.email
  const name = req.body.name
  const password = req.body.password

  try {
    // Хэшируем пароль для сохранения в БД в виде хэша
    // 12 - salt
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    })

    const result = await user.save()

    res.status(201).json({
      message: 'User created',
      userId: result._id,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    console.log('Error from auth.controller -> signup -> bcrypt.hash: ', err)

    // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
    next(err)
  }
}

// Авторизация
exports.login = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  let loadedUser

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error('A user with this email could not be found')
        error.statusCode = 401
        throw error
      }

      loadedUser = user

      return bcrypt.compare(password, user.password)
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Wrong password')
        error.statusCode = 401
        throw error
      }

      // СОЗДАНИЕ JWT-токена
      // Первый параметр - шифруем в токен email и userId
      // Второй параметр - секрет
      // Третий параметр - необязательные опции. expiresIn - срок действия токена
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'somesupersecretsecret',
        {
          expiresIn: '1h',
        }
      )

      res.status(200).json({
        token: token,
        userId: loadedUser._id.toString(),
      })
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      console.log('Error from auth.controller -> login -> User.findOne: ', err)

      // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
      next(err)
    })
}
