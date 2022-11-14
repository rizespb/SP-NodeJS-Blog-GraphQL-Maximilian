import React from 'react'

import './Image.css'

const image = (props) => {
  return (
    <div
      className="image"
      style={{
        // Мое добавление replace:
        // url с бэка содержит \, а в css поддерживается только /
        backgroundImage: `url('${props.imageUrl.replace(/\\/g, '/')}')`,
        backgroundSize: props.contain ? 'contain' : 'cover',
        backgroundPosition: props.left ? 'left' : 'center',
      }}
    />
  )
}

export default image
