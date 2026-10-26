<script setup lang="ts">
import type { QueryItem } from '#shared/types'

const props = defineProps<{
  query: QueryItem
  priority?: boolean
}>()

// render the first few pages upfront so scrolling the carousel never shows an empty state
const pages = await Promise.all([1, 2, 3].map(page => listMedia(props.query.type, props.query.query, page)))
const item = { results: pages.flatMap(page => page.results) }
</script>

<template>
  <CarouselBase>
    <template #title>
      {{ $t(query.title) }}
    </template>
    <template #more>
      <NuxtLink :to="`/${props.query.type}/category/${props.query.query}`" n-link>
        {{ $t('Explore more') }}
      </NuxtLink>
    </template>
    <MediaCard
      v-for="(i, index) of item?.results || []"
      :key="i.id"
      :item="i"
      :query="props.query"
      :type="props.query.type"
      :priority="props.priority && index < 10"
      flex-1 w-40 md:w-60
    />
  </CarouselBase>
</template>
