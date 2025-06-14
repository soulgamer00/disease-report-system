<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeAuth } from '$lib/stores/auth';

  onMount(() => {
    // Initialize authentication state on app start
    initializeAuth();
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <slot />
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Inter', 'Sarabun', sans-serif;
    background-color: #f8f9fa;
    color: #2c3e50;
    line-height: 1.6;
  }

  :global(main) {
    min-height: 100vh;
  }
</style>