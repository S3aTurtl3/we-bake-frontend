<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import { formatDate } from "../../utils/formatDate";

const props = defineProps(["recipe"]);
const name = ref(props.recipe.dishName);
const step1 = ref<string>(props.recipe.steps[0].instructions);
const emit = defineEmits(["editPost", "refreshPosts"]);

const editPost = async (content: string) => {
  try {
    await fetchy(`api/recipes/${props.recipe._id}`, "PATCH", { body: { update: content } });
  } catch (e) {
    return;
  }
  emit("editPost");
  emit("refreshPosts");
};
</script>

<template>
  <form @submit.prevent="editPost(JSON.stringify({ dishName: name, steps: [{ instructions: step1 }] }))">
    <h3>Dish name</h3>
    <textarea id="content" v-model="name" placeholder="Dish name" required> </textarea>
    <h3>Step 1</h3>
    <textarea id="content" v-model="step1" placeholder="Measure out the flour..." required> </textarea>

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
