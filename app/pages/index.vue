<script setup lang="ts">
import type { MediaType } from '#shared/types'
import { QUERY_LIST } from '~/constants/lists'

const type: MediaType = 'movie'

const queries = [
  QUERY_LIST.movie[0],
  QUERY_LIST.tv[0],
] as const

const featured = await $fetch('/api/featured')
const list = await listMedia(type, featured.query || queries[0].query, 1)
const firstItem = list.results[0]
const item = firstItem ? await getMedia(type, firstItem.id) : undefined

const img = useImage()
useHead({
  link: item?.backdrop_path
    ? [{
        rel: 'preload',
        as: 'image',
        fetchpriority: 'high',
        href: img(`/tmdb${item.backdrop_path}`, { width: 1220, format: 'webp' }),
      }]
    : [],
})
</script>

<template>
  <div>
    <PromoBanner />
    <template v-if="item">
      <ClientOnly>
        <NuxtLink :to="`/${type}/${item.id}`">
          <MediaHero :item="item" />
        </NuxtLink>
      </ClientOnly>
    </template>
    <CarouselAutoQuery
      v-for="(query, index) of queries"
      :key="query.type + query.query"
      :query="query"
      :priority="index === 0"
    />
    <TheFooter />
  </div>
</template>
