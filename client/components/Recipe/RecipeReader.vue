<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["recipeId"]);
type MediaType = { instructions: string; visuals: Array<{ url: string }> };
const loaded = ref(false);
const parsedRecipe = ref<ParsedRecipe>();
const recipeDoc = ref();

async function loadRecipe() {
  let recipe;
  try {
    recipe = await fetchy(`/api/recipes/${props.recipeId}`, "GET"); // TODO: type checking as well...
  } catch (e) {
    console.log(e);
    return;
  }
  recipeDoc.value = recipe;
  parsedRecipe.value = {
    dishName: recipe.dishName ?? "Untitled Recipe",
    outputSpecification: recipe.outputSpecification ?? new Array<MediaType>(),
    setupRequirements: recipe.setupRequirements ?? new Array<MediaType>(),
    steps: recipe.steps ?? new Array<MediaType>(),
    authorName: "REPLACE", // TODO: REplace
  };
}

type ParsedRecipe = { dishName: string; outputSpecification: Array<MediaType>; setupRequirements: Array<MediaType>; steps: Array<MediaType>; authorName: string };

onBeforeMount(async () => {
  await loadRecipe(); // TODO: Catch error from server when not logged in
  loaded.value = true;
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
    <p>{{ parsedRecipe.setupRequirements }}</p>
    <h2>Steps</h2>
    <p>{{ parsedRecipe.steps }}</p>
    <div class="base">
      <article class="timestamp">
        <p v-if="recipeDoc.dateCreated !== recipeDoc.dateUpdated">Edited on: {{ formatDate(recipeDoc.dateUpdated) }}</p>
        <p v-else>Created on: {{ formatDate(recipeDoc.dateCreated) }}</p>
      </article>
    </div>
  </article>
  <article v-else>
    <p class="author">author hi {{ parsedRecipe }}</p>
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
