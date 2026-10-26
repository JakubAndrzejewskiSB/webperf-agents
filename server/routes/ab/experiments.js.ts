// A/B testing vendor script: reveals the page once experiments are applied
export default defineEventHandler(async (event) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  setResponseHeader(event, 'content-type', 'text/javascript')
  return 'document.documentElement.classList.remove(\'ab-hide\')'
})
