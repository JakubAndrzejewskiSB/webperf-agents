<script setup lang="ts">
import type { Media, MediaType, QueryItem } from '#shared/types'

const props = defineProps<{
  type: MediaType
  item: Media
  query?: QueryItem
  priority?: boolean
}>()

const overviewWords = computed(() => (props.item.overview || '').split(' '))
</script>

<template>
  <NuxtLink
    :to="`/${item.media_type || type}/${item.id}`" pb2
    data-card
  >
    <div
      block bg-gray4:10 p1 relative class="group"
      transition duration-100
      hover="scale-105 z10"
    >
      <NuxtImg
        v-if="item.poster_path"
        width="400"
        height="225"
        format="webp"
        :src="`/tmdb${item.poster_path}`"
        :alt="item.title || item.name"
        :loading="priority ? 'eager' : 'lazy'"
        w-full h-auto object-cover
      />
      <div v-else h-full op10 flex>
        <div i-ph:question ma text-4xl />
      </div>
      <!-- quick view revealed word by word on hover -->
      <div
        absolute inset-1 p3 bg-black:80 text-xs leading-relaxed of-hidden
        op0 group-hover:op100 transition pointer-events-none
        aria-hidden="true"
      >
        <span
          v-for="(word, index) of overviewWords"
          :key="index"
          inline-block mr-1 transition
          :style="{ transitionDelay: `${index * 15}ms` }"
        >{{ word }}</span>
      </div>
    </div>
    <div mt-2 font-display>
      {{ item.title || item.name }}
    </div>
    <div flex text-sm gap-2 items-center>
      <StarsRate w-20 :value="item.vote_average" />
      <div op60>
        {{ formatVote(item.vote_average) }}
      </div>
    </div>
  </NuxtLink>
</template>
