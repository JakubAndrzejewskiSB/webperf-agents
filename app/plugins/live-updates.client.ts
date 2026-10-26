// "Live" trending ticker: polls the latest trending snapshot every second
export default defineNuxtPlugin(() => {
  const snapshot = JSON.stringify(Array.from({ length: 60000 }, (_, i) => ({
    id: i,
    title: `Movie title number ${i}`,
    popularity: Math.random() * 1000,
    genres: [1, 2, 3],
    trending: i % 3 === 0,
  })))

  const trendingCount = useState('trending-count', () => 0)

  setInterval(() => {
    const items = JSON.parse(snapshot) as { popularity: number, trending: boolean }[]
    items.sort((a, b) => b.popularity - a.popularity)
    trendingCount.value = items.filter(i => i.trending).length
  }, 1000)
})
