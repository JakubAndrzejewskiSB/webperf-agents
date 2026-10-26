// Editorial config for the home page hero, backed by a slow CMS
export default defineEventHandler(async () => {
  await new Promise(resolve => setTimeout(resolve, 1200))
  return { query: 'popular' }
})
