export function get() {
  // Redirect to /wiki/MainPage
  return new Response('Redirecting to /wiki/About/Wiki', {
    status: 302,
    headers: {
      Location: '/wiki/About/Wiki',
    },
  })
}
