const fs = require('fs')
const path = require('path')

// Валидация
const { validationResult } = require('express-validator/check')

// webScokets
const io = require('../socket')

const Post = require('../models/post')
const User = require('../models/user')

// Получить посты
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1
  const perPage = 2

  try {
    const totalItems = await Post.find().countDocuments()

    const posts = await Post.find()
      // populate - в Post в поле creator мы храним только id автора. populate - наполняет в объектах post[] поле creator полными данными юзера с соответствующим id
      .populate('creator')
      // Сортируем по дате создания по убыванию
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)

    res.status(200).json({
      message: 'Fetched posts successfully',
      posts: posts,
      totalItems: totalItems,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    console.log('Error from getPosts Post.find(): ', err)

    // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
    next(err)
  }
}

// Создать новый пост
exports.createPost = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect')
    error.statusCode = 422

    throw error
  }

  // Запрос должен содержать файл изоюражения для поста
  // В req.file его поместит Multer после парсинга body
  if (!req.file) {
    const error = new Error('No image provided')
    throw error
  }

  const imageUrl = req.file.path
  const title = req.body.title
  const content = req.body.content
  let creator

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  })

  try {
    await post.save()

    const user = await User.findById(req.userId)

    // Несмотря на то, что user.posts - это массив _id постов, а Post - это целый пост, будет добавлен только post._id
    user.posts.push(post)

    await user.save()

    // Отправляем данные по вебСокет
    // broadcast - отправить сообщение всем юзерам, кроме инициатора текущего запроса (createPost)
    // emit - отправить сообщение ВООБЩЕ всем юзерам
    // 'posts' - любое имя для события
    // второй аргумент - передаваемая информация
    io.getIO().emit('posts', { action: 'create', post: { ...post._doc, creator: { _id: req.userId, name: user.name } } })

    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: user._id, name: user.name },
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    console.log('Error from createPost post.save(): ', err)

    // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
    next(err)
  }
}

// Получение отдельного поста
exports.getPost = (req, res, next) => {
  const postId = req.params.postId

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find post')
        error.statusCode = 404

        // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
        throw error
      }

      res.status(200).json({
        message: 'Post fetched',
        post: post,
      })
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      console.log('Error from getPost Post.findById(): ', err)

      // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
      next(err)
    })
}

// Обновление поста
exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect')
    error.statusCode = 422

    throw error
  }

  const title = req.body.title
  const content = req.body.content
  let imageUrl = req.body.image

  // Если был загружен новый файл, тогда он будет в req.file
  if (req.file) {
    imageUrl = req.file.path
  }

  if (!imageUrl) {
    const error = new Error('No file picked')
    error.statusCode = 422
    throw error
  }

  try {
    // populate - в Post в поле creator мы храним только id автора. populate - наполняет в объекте post поле creator полными данными юзера с соответствующим id
    const post = await Post.findById(postId).populate('creator')

    if (!post) {
      const error = new Error('Could not find post')
      error.statusCode = 404

      // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
      throw error
    }

    // Если постпытается обновить не создатель поста
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized')
      error.statusCode = 403

      // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
      throw error
    }

    // Если новый путь к изображению не равен новому (изображение обновили), удаляем старое изображение с сервера
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl)
    }

    post.title = title
    post.imageUrl = imageUrl
    post.content = content

    const result = await post.save()

    // Отправляем данные по вебСокет
    // broadcast - отправить сообщение всем юзерам, кроме инициатора текущего запроса (createPost)
    // emit - отправить сообщение ВООБЩЕ всем юзерам
    // 'posts' - любое имя для события
    // второй аргумент - передаваемая информация
    io.getIO().emit('posts', { action: 'update', post: result })

    res.status(200).json({
      message: 'Post updated!',
      post: result,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    console.log('Error from getPost Post.findById(): ', err)

    // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
    next(err)
  }
}

// Удаление поста по ID
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId

  try {
    const post = await Post.findById(postId)

    if (!post) {
      const error = new Error('Could not find post')
      error.statusCode = 404

      // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
      throw error
    }

    // Если постпытается обновить не создатель поста
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized')
      error.statusCode = 403

      // Ошибка попадает в catch, а catch прокинет ее в обработчик ошибок next(err)
      throw error
    }

    clearImage(post.imageUrl)

    await Post.findByIdAndRemove(postId)

    // Теперь удалим пост из масиива posts в объекте User
    const user = await User.findById(req.userId)
    // pull - метод Mongoose - для удаления элемента по ID в массиве
    user.posts.pull(postId)

    await user.save()

    // Отправляем данные по вебСокет
    // broadcast - отправить сообщение всем юзерам, кроме инициатора текущего запроса (createPost)
    // emit - отправить сообщение ВООБЩЕ всем юзерам
    // 'posts' - любое имя для события
    // второй аргумент - передаваемая информация
    io.getIO().emit('posts', { action: 'delete', post: postId })

    res.status(200).json({ message: 'Deleted post' })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    console.log('Error from deletePost Post.findById(): ', err)

    // Пробрасываем ошибку, чтобы сработал глобальный Error Handler в app.js
    next(err)
  }
}

// Удаление страого изображения в случае загрузки нового изображения пр иобновлении поста
const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, (err) => {
    console.log('Error from clearImage: ', err)
  })
}
