const mongoose = require('mongoose')
const Schema = mongoose.Schema

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      // Добавляем связь с юзером
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  // mongoose будет автоматически доавлять timestamp в коллекцию при добавлении или обновлении документа
  // поля createdAt и  updatedAt
  { timestamps: true }
)

//
module.exports = mongoose.model('Post', postSchema)
