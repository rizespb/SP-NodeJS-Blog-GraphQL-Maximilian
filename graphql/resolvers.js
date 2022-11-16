// Хэширование пароля
const bcrypt = require('bcryptjs')

// Валидация данных
const validator = require('validator')

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

      // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
      throw error
    }
    //----------------------------------- //

    const existingUser = await User.findOne({ email: userInput.email })

    if (existingUser) {
      const error = new Error('User exists already!')
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
}
