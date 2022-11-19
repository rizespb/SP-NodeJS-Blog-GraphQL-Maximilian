const path = require('path')
const fs = require('fs')

// Удаление страого изображения в случае загрузки нового изображения пр иобновлении поста
const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)

  fs.unlink(filePath, (err) => {
    console.log('Error from clearImage: ', err)
  })
}

exports.clearImage = clearImage
