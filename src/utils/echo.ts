import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Pusher cần được gắn vào window để laravel-echo nhận diện
declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY as string,
  cluster: (import.meta.env.VITE_PUSHER_APP_CLUSTER as string) || 'mt1',
  forceTLS: true,

  // Không cần authEndpoint vì dùng public channel
})

export default echo
