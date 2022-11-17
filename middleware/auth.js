const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization')

  if (!authHeader) {
    req.isAuth = false

    return next()
  }

  const token = authHeader.split(' ')[1]

  let decodedToken
  try {
    // Декодирование и верификация токена
    // Есть еще метод decode, но он только декодирует, не верифицируя
    // Второй параметр - секрет - который мы использовали при формировании токена
    decodedToken = jwt.verify(token, 'somesupersecretsecret')
  } catch (err) {
    req.isAuth = false

    return next()
  }

  // Если не удалось декодировать и верифицировать токен
  if (!decodedToken) {
    req.isAuth = false

    return next()
  }

  // В req.userId сохраняем userId, который мы кодировали в токен при создании токена
  req.userId = decodedToken.userId
  req.isAuth = true

  next()
}
