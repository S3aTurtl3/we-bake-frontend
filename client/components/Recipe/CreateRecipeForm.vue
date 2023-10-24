<script setup lang="ts">
import { ref } from "vue";
import router from "../../router";
import { fetchy } from "../../utils/fetchy";

const content = ref("");
const emit = defineEmits(["refreshPosts"]);

const createRecipe = async (content: string) => {
  // TODO: validations
  let recipeCreationResponse: { recipeId: string };
  try {
    recipeCreationResponse = await fetchy("api/recipes", "POST", {
      body: { recipe: content },
    });
  } catch (_) {
    return;
  }
  emit("refreshPosts");
  emptyForm();
  await router.push({ path: `/recipes/${recipeCreationResponse.recipeId}` });
};

const emptyForm = () => {
  content.value = "";
};
</script>

<template>
  <form @submit.prevent="createRecipe(JSON.stringify({ dishName: content }))">
    <label for="content">Recipe Name:</label>
    <textarea id="content" v-model="content" placeholder="Name the Recipe!" required> </textarea>
    <button type="submit" class="pure-button-primary pure-button">Create Recipe</button>
  </form>
</template>

<style scoped>
form {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}
</style>
