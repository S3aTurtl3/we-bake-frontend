<script setup lang="ts">
import RecipeReader from "@/components/Recipe/RecipeReader.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import EditRecipeForm from "./EditRecipeForm.vue";
const props = defineProps(["recipeId"]);
const editing = ref(false);
const recipe = ref();
const loaded = ref(false);

function toggleEditView() {
  editing.value = !editing.value;
}

async function stopEditing() {
  await loadRecipe();
  editing.value = false;
}

async function loadRecipe() {
  let fetchResults;
  try {
    fetchResults = await fetchy("/api/recipes/" + props.recipeId, "GET");
  } catch (_) {
    console.log(_);
    return;
  }
  recipe.value = fetchResults;
}

const { currentUsername } = storeToRefs(useUserStore());

onBeforeMount(async () => {
  await loadRecipe(); // TODO: Catch error from server when not logged in
  loaded.value = true;
});
</script>

<template>
  <!--use bread-crumb-->
  <div v-if="loaded">
    <div class="header">
      <v-row justify="space-between">
        <v-breadcrumbs :items="[{ title: 'Recipes', href: '/recipes' }, recipe.dishName]"></v-breadcrumbs>
        <v-btn v-on:click="toggleEditView" v-if="!editing">Edit</v-btn>
      </v-row>
    </div>
    <RecipeReader v-bind:recipe="recipe" v-on:toggleEdit="toggleEditView" />
    <EditRecipeForm v-if="editing" v-bind:recipe="recipe" v-on:refreshPosts="loadRecipe" v-on:editPost="stopEditing" />
  </div>
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
