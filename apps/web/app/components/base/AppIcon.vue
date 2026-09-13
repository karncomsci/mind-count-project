<script setup lang="ts">
const icons = {
  chart: 'M4 16l5-5 4 3 7-9M15 5h5v5',
  document: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',
  building: 'M3 9l9-6 9 6H3zm2 3v7m7-7v7m7-7v7M3 21h18',
  sales: 'M12 3v18m5-14H9a3 3 0 000 6h6a3 3 0 010 6H6',
  box: 'M3 7l9-5 9 5v10l-9 5-9-5V7zm0 0l9 5 9-5M12 12v10M7 4l10 5',
  users:
    'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m20 0v-2a4 4 0 00-3-3.87M13 3a4 4 0 010 8M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-5-5m2-6a7 7 0 11-14 0 7 7 0 0114 0z',
  download: 'M12 3v12m-5-5l5 5 5-5M4 16v5h16v-5',
  print: 'M6 9V3h12v6M6 18H3v-8h18v8h-3M6 14h12v7H6zM17 12h1',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  edit: 'M16 3l5 5-12 12H4v-5L16 3zM13 6l5 5',
  share:
    'M8 10l8-5M8 14l8 5M8 12a3 3 0 11-6 0 3 3 0 016 0zM22 4a3 3 0 11-6 0 3 3 0 016 0zM22 20a3 3 0 11-6 0 3 3 0 016 0z',
  copy: 'M8 8h12v13H8zM16 8V3H3v13h5',
  envelope: 'M3 5h18v14H3zM3 5l9 8 9-8',
  close: 'M6 6l12 12M6 18L18 6',
  check: 'M5 12l4 4L19 6',
  clock: 'M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  info: 'M12 11v6M12 7h.01m9 5a9 9 0 11-18 0 9 9 0 0118 0z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  arrow: 'M19 12H5m6-6l-6 6 6 6',
  settings:
    'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1m-2.4 6a4 4 0 11-8 0 4 4 0 018 0z',
}
defineProps<{ name: keyof typeof icons }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="h-5 w-5 shrink-0"
  >
    <path :d="icons[name]" />
  </svg>
</template>
