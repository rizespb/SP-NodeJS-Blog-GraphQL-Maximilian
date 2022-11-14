// Хэширование пароля
const bcrypt = require('bcryptjs')

const User = require('../models/user')

// В резолвере мы описываем все query и mutation, которые указали в схеме
module.exports = {
  createUser: async function ({ userInput }, req) {
    // const email = userInput.email
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
