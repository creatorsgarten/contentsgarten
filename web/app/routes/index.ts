export function loader() {
  // Redirect to /wiki/MainPage
  return new Response('You are being redirected to /wiki/MainPage', {
    status: 302,
    headers: {
      Location: '/wiki/MainPage',
    },
  })
}
