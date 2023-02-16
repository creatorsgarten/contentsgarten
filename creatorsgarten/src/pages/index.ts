export function get() {
  return new Response('Redirecting to /wiki/MainPage', {
    status: 302,
    headers: {
      Location: '/wiki/MainPage',
    },
  })
}
