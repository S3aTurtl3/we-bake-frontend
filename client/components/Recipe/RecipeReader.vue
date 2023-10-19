<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { ComputedRef, computed, ref } from "vue";

const props = defineProps(["recipe"]);
type MediaType = { instructions: string; visuals: Array<{ url: string }> };
const loaded = ref(false);
const recipeDoc = props.recipe;

type ParsedRecipe = { dishName: string; outputSpecification: Array<MediaType>; setupRequirements: Array<MediaType>; steps: Array<MediaType>; authorName: string };
const parsedRecipe: ComputedRef<ParsedRecipe> = computed(() => {
  return {
    dishName: props.recipe.dishName ?? "Untitled Recipe",
    outputSpecification: props.recipe.outputSpecification ?? "",
    setupRequirements: props.recipe.setupRequirements ?? new Array<string>(),
    steps: props.recipe.steps ?? new Array<MediaType>(),
    authorName: "REPLACE", // TODO: REplace
  };
});

const { currentUsername } = storeToRefs(useUserStore());
</script>

<template>
  <article v-if="parsedRecipe !== undefined">
    <h1>{{ parsedRecipe.dishName }}</h1>
    <p class="author">author is TBD</p>
    <h2>Description</h2>
    <p>{{ parsedRecipe.outputSpecification }}</p>
    <h2>Ingredients/Equipment</h2>
    <div class="ingredient">
      <ul>
        <li v-for="i in parsedRecipe.setupRequirements.length" :key="i">{{ parsedRecipe.setupRequirements[i - 1] }}</li>
      </ul>
    </div>
    <h2>Steps</h2>
    <ol>
      <li v-for="i in parsedRecipe.steps.length" :key="i">{{ parsedRecipe.steps[i - 1] }}</li>
    </ol>
    <div class="base">
      <article class="timestamp">
        <p v-if="recipeDoc.dateCreated !== recipeDoc.dateUpdated">Edited on: {{ formatDate(recipeDoc.dateUpdated) }}</p>
        <p v-else>Created on: {{ formatDate(recipeDoc.dateCreated) }}</p>
      </article>
    </div>
  </article>
  <article v-else-if="loaded">
    <p>Recipe could not be loaded.</p>
  </article>
  <article v-else>
    <p>Loading...</p>
  </article>
</template>

<style scoped>
p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.base article:only-child {
  margin-left: auto;
}
</style>
