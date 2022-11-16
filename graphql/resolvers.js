// Хэширование пароля
const bcrypt = require('bcryptjs')

// Валидация данных
const validator = require('validator')

// JWT-token
const jwt = require('jsonwebtoken')

const User = require('../models/user')

// В резолвере мы описываем все query и mutation, которые указали в схеме
module.exports = {
  createUser: async function ({ userInput }, req) {
    //--- Валидация входящих данных--- //
    const errors = []
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid' })
    }

    if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 4 })) {
      errors.push({ message: 'Password too short' })
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input')

      error.data = errors
      error.code = 422

      // Ошибкку обработает GraphQL в formatError в app.js
      throw error
    }
    //----------------------------------- //

    const existingUser = await User.findOne({ email: userInput.email })

    if (existingUser) {
      const error = new Error('User exists already!')

      // Ошибкку обработает GraphQL в formatError в app.js
      throw error
    }

    // Хэшируем пароль для сохранения в БД в виде хэша
    // 12 - salt
    const hashedPassword = await bcrypt.hash(userInput.password, 12)

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    })

    const createdUser = await user.save()

    // ...createdUser._doc - получить все данные из объекта пользователя createdUser без метаданных, добавляемых Mongoose
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    }
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email })

    if (!user) {
      const error = new Error('User not found')
      error.code = 401

      // Ошибкку обработает GraphQL в formatError в app.js
      throw error
    }

    // Сравнение хэшей паролей в запросе и в БД
    const isEqual = await bcrypt.compare(password, user.password)

    if (!isEqual) {
      const error = new Error('Password is incorrect')
      error.code = 401

      // Ошибкку обработает GraphQL в formatError в app.js
      throw error
    }

    // Генерируем jwt-token
    // Кодируем в него ту информацию, которую считаем нужной (id, email)
    // Делаем это с использованием соли - somesupersecretsecret
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'somesupersecretsecret',
      {
        expiresIn: '1h',
      }
    )

    return { token: token, userId: user._id.toString() }
  },
}
