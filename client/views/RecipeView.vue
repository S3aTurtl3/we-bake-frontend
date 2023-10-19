<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import RecipeReaderAndEditor from "../components/Recipe/RecipeReaderAndEditor.vue";

const props = defineProps(["recipeId"]);

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Recipes</h1>
    <section>
      <p v-if="isLoggedIn">Welcome {{ currentUsername }}!</p>
    </section>
    <RecipeReaderAndEditor v-bind:recipeId="props.recipeId" />
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
