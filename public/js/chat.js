const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  const { username, text, createdAt } = message

  const html = Mustache.render(messageTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (coordinates) => {
  const { username, location, createdAt } = coordinates

  const url = Mustache.render(locationTemplate, {
    username,
    location,
    createdAt: moment(createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', url)
  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')
  // disable
  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    // enable
    if (error) {
      return console.log(error)
    }

    console.log('Message delivered!')
  })
})

document.querySelector('#send-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords

    const location = {
      latitude,
      longitude
    }
    socket.emit('sendLocation', location, (error) => {
      $sendLocationButton.removeAttribute('disabled')
      if (error) {
        return console.log(error)
      }

      console.log('Location shared!')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})