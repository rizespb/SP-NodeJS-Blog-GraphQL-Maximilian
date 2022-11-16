const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
// multer - парсер для извлечения файлов из body
const multer = require('multer')

// GraphQL
const { graphqlHTTP } = require('express-graphql')
const graphQlSchema = require('./graphql/schema')
const graphQlResolver = require('./graphql/resolvers')

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

  // Это сделано для GraphQL:
  // Когда полетит предаврительный запрос OPTIONS, GraphQL вернет на него ошибку, т.к. работает только с GET и POST запросами
  // Поэтому при работе с GraphQL мы вручную возвращаем статус 200
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

// Подлкючаем роут '/graphql' (роут может быть любой, но есть общая договоренность)
// schema - схема
// rootValue - резолверы
// graphiql - активирует специальный инструмент для тестирования graphql
// Этот инструмент доступен в браузере по адресу http://localhost:8080/graphql (справа есть документация)
app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolver,
    graphiql: true,
    // formatError - метод для обработки ошибок (скорее, форматирование - придание ошибке нужного вида)
    // сам объект err - ошибка GraphQL (например, неправильный синтаксис в запросе)
    // err.originalError - ошибка, которую прокидываем мы или сторонняя библиотека
    formatError(err) {
      if (!err.originalError) {
        return err
      }

      const data = err.originalError.data
      const message = err.message || 'An error occured (formated with graphQL formatError method)'
      const code = err.originalError.code || 500

      return { message: message, status: code, data: data }
    },
  })
)

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
  .connect('mongodb+srv://testuser:testpassword@cluster0.qowv7.mongodb.net/graphql-blog?retryWrites=true&w=majority')
  .then((result) => {
    app.listen(8080)
  })
  .catch((err) => console.log('Error from app.js mongoose.connect: ', err))
