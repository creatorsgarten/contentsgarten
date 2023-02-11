export function get() {
  // Redirect to /wiki/MainPage
  return new Response('Redirecting to /wiki/MainPage', {
    status: 302,
    headers: {
      Location: '/wiki/MainPage',
    },
  })
}
