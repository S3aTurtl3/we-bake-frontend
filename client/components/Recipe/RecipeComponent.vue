<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";

const props = defineProps(["recipe"]);
const emit = defineEmits(["editPost", "refreshPosts", "manageAccess"]);
const { currentUsername } = storeToRefs(useUserStore());
</script>

<template>
  <router-link v-bind:to="`/recipes/${props.recipe._id}`">
    <div class="preview">
      <h3>{{ props.recipe.dishName }}</h3>
      <p>author: {{ props.recipe.moderator?.username ?? "Non-existent user" }}</p>
    </div>
  </router-link>
  <div class="base">
    <menu>
      <!-- TODO: instead of "true", check if the current user has access-->
      <li v-if="true"><button class="btn-small pure-button" @click="emit('editPost', props.recipe._id)">Edit</button></li>
      <!-- TODO: instead of "true", check if the current user is author-->
      <li v-if="true"><button class="btn-small pure-button" @click="emit('manageAccess', props.recipe._id)">Manage Access Controls</button></li>
    </menu>
  </div>
  <article class="timestamp">
    <p v-if="props.recipe.dateCreated !== props.recipe.dateUpdated">Edited on: {{ formatDate(props.recipe.dateUpdated) }}</p>
    <p v-else>Created on: {{ formatDate(props.recipe.dateCreated) }}</p>
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
  flex-wrap: wrap;
}

.base article:only-child {
  margin-left: auto;
}

a {
  color: #3a2513;
  text-decoration: none;
  background-color: rgb(255, 252, 234);
}
</style>
