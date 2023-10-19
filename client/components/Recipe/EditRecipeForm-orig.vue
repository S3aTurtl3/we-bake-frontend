<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import { formatDate } from "../../utils/formatDate";

const props = defineProps(["recipe"]);
const name = ref<string>(props.recipe.dishName ? props.recipe.dishName : "untitled recipe"); // what happens if you update the recipe in another tab? that state should be reflected here...sync with database updates for this recipe
const step1 = ref<string>(props.recipe.steps ? props.recipe.steps[0].instructions : "");
const description = ref<string>(props.recipe.outputSpecification ?? "");
const ingredients = ref<Array<string>>(props.recipe.ingredients ? props.recipe.ingredients.slice() : []); // watchout for aliasing
const emit = defineEmits(["editPost", "refreshPosts"]);

const editPost = async (content: string) => {
  try {
    await fetchy(`/api/recipes/${props.recipe._id}`, "PATCH", { body: { update: content } });
  } catch (e) {
    return;
  }
  emit("editPost");
  emit("refreshPosts");
};
</script>

<template>
  <form @submit.prevent="editPost(JSON.stringify({ dishName: name, outputSpecification: description, ingredients: ingredients, steps: [{ instructions: step1 }] }))">
    <div class="group">
      <label>Dish name</label>
      <textarea v-model="name" placeholder="Dish name" required> </textarea>
    </div>
    <div class="group">
      <label>Description</label>
      <textarea v-model="description" placeholder="Describe your dish" required> </textarea>
    </div>
    <div class="group">
      <label>Ingredients</label>
      <div class="ingredient">
        <input type="text" v-model="ingredients" placeholder="e.g. 1/2 a cup of flour..." required />
      </div>
      <button>Add Ingredient</button>
    </div>
    <div class="group">
      <label>Step 1</label>
      <div class="step">
        <textarea v-model="step1" placeholder="e.g. Measure out the flour..." required> </textarea>
        <button>Add step</button>
      </div>
    </div>
    <div class="base">
      <menu>
        <li><button class="btn-small pure-button-primary pure-button" type="submit">Save</button></li>
        <li><button class="btn-small pure-button" @click="emit('editPost')">Cancel</button></li>
      </menu>
      <p v-if="props.recipe.dateCreated !== props.recipe.dateUpdated" class="timestamp">Edited on: {{ formatDate(props.recipe.dateUpdated) }}</p>
      <p v-else class="timestamp">Created on: {{ formatDate(props.recipe.dateCreated) }}</p>
    </div>
  </form>
</template>

<style scoped>
form {
  background-color: var(--base-bg);
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  border-radius: 4px;
  resize: none;
}

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

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}
</style>
