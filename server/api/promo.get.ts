export default defineEventHandler(async () => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return {
    title: 'Movie Night Weekend',
    text: 'Discover this week\'s most popular movies and TV shows, hand-picked by our editors.',
  }
})
