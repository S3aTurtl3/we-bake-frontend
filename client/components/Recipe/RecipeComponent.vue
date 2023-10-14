<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";

const props = defineProps(["recipe"]);
const emit = defineEmits(["editPost", "refreshPosts"]);
const { currentUsername } = storeToRefs(useUserStore());
</script>

<template>
  <p class="author">author is TBD</p>
  <p>{{ props.recipe.dishName }}</p>
  <div class="base">
    <menu v-if="true">
      <!-- TODO: instead of "false", check if the current user is author-->
      <li><button class="btn-small pure-button" @click="emit('editPost', props.recipe._id)">Edit</button></li>
    </menu>
    <article class="timestamp">
      <p v-if="props.recipe.dateCreated !== props.recipe.dateUpdated">Edited on: {{ formatDate(props.recipe.dateUpdated) }}</p>
      <p v-else>Created on: {{ formatDate(props.recipe.dateCreated) }}</p>
    </article>
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
