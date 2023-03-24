export async function GET(request: Request) {
  // Redirect to `/wiki/MainPage`
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/wiki/MainPage',
    },
  })
}
