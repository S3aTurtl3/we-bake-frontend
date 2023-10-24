<script setup lang="ts">
import RecipeListComponent from "@/components/Recipe/RecipeListComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Recipes</h1>
    <section>
      <h3 v-if="!isLoggedIn">Login to make, view, and share recipes</h3>
    </section>
    <RecipeListComponent />
  </main>
</template>

<style scoped>
section,
h1 {
  text-align: center;
}
</style>
