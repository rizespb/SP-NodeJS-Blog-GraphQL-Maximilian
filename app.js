const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
// multer - парсер для извлечения файлов из body
const multer = require('multer')

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')

const app = express()

// Конфигурация хранилища для файлов для multer
const fileStorage = multer.diskStorage({
  // destination - имя папки для сохранения
  destination: (req, file, callback) => {
    callback(null, 'images')
  },
  // filename - имя файла
  filename: (req, file, callback) => {
    // Мое исправление: replace(/:/g, '-')
    callback(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
  },
})

// Фильтруем файлы по типу
const fileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    // true - если реашем сохранять файл
    callback(null, true)
  } else {
    // false - если реашем не сохранять файл
    callback(null, false)
  }
}

// Для парсинга данных из форм
// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded

// Для парсинга json-данных
app.use(bodyParser.json())

// storage - конфигурация хранилища файлов
// fileFilter - фильтр файлов (в нашем случае по расширению)
// image - файл будет в поле image body
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))

// Все запросы /images обрабатываем как статические
// Строим абсолютный путь к файлу
// __dirname -  папка, где лежит текущий файл app.js
app.use('/images', express.static(path.join(__dirname, 'images')))

// Настройка CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  // Клиент может отсылать, помимо стандартных заголовков, еще заголовки 'Content-Type, Authorization'
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  next()
})

app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)

// Обработчик ошибок
app.use((error, req, res, next) => {
  console.log('Error from app Error Handler: ', error)

  const status = error.statusCode || 500
  const message = error.message
  const data = error.data

  res.status(status).json({
    message: message,
    data: data,
  })
})

mongoose
  .connect('mongodb+srv://testuser:testpassword@cluster0.qowv7.mongodb.net/blog?retryWrites=true&w=majority')
  .then((result) => {
    const server = app.listen(8080)

    // Инициализация webSocket-соединения
    // Начиная с версии Socket.IO v3 надо прописывать CORS-ы и для webSocket-соединения
    const io = require('./socket').init(server)

    // Переданный вторым аргументом коллбэк будет выполнен для каждого входящего webSocket запроса
    io.on('connection', (socket) => {
      console.log('Client connected with web-sockets')
    })
  })
  .catch((err) => console.log('Error from app.js mongoose.connect: ', err))
