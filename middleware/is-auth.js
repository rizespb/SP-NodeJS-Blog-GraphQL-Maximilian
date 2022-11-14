const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization')

  if (!authHeader) {
    const error = new Error('Not authenticated')
    error.statusCode = 401
    throw error
  }

  const token = authHeader.split(' ')[1]

  let decodedToken
  try {
    // Декодирование и верификация токена
    // Есть еще метод decode, но он только декодирует, не верифицируя
    // Второй параметр - секрет - который мы использовали при формировании токена
    decodedToken = jwt.verify(token, 'somesupersecretsecret')
  } catch (err) {
    err.statusCode = 500
    throw err
  }

  // Если не удалось декодировать и верифицировать токен
  if (!decodedToken) {
    const error = new Error('Not authenticated')
    error.statusCode = 401
    throw error
  }

  // В req.userId сохраняем userId, который мы кодировали в токен при создании токена
  req.userId = decodedToken.userId
  next()
}
