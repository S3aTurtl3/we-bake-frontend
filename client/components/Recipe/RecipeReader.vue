<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { ComputedRef, computed, ref } from "vue";

const props = defineProps(["recipe"]);
type MediaType = { instructions: string; visuals: string };
const loaded = ref(false);

const recipeDoc = computed(() => {
  if (props.recipe === undefined) return;
  return props.recipe;
});

type ParsedRecipe = { dishName: string; outputSpecification: Array<MediaType>; setupRequirements: Array<MediaType>; steps: Array<MediaType>; authorName: string };
const parsedRecipe: ComputedRef<ParsedRecipe | undefined> = computed(() => {
  if (props.recipe === undefined) return;
  return {
    dishName: props.recipe.dishName ?? "Untitled Recipe",
    outputSpecification: props.recipe.outputSpecification ?? "",
    setupRequirements: props.recipe.setupRequirements ?? new Array<string>(),
    steps: props.recipe.steps ?? new Array<MediaType>(),
    authorName: props.recipe.moderator.username ?? "(author not known)",
  };
});

const { currentUsername } = storeToRefs(useUserStore());
</script>

<template>
  <div class="recipe" v-if="parsedRecipe !== undefined">
    <v-row align="center" justify="start" space>
      <h1>{{ parsedRecipe.dishName }}</h1>
      <v-col>
        <p class="author">by {{ parsedRecipe.authorName }}</p>
      </v-col>
    </v-row>
    <h4 v-if="parsedRecipe.outputSpecification">Description</h4>
    <p class="desc">{{ parsedRecipe.outputSpecification }}</p>
    <hr />
    <v-container>
      <v-row>
        <v-col cols="3">
          <!-- Ingredients go here -->

          <div class="ingredient">
            <h2>Ingredients</h2>

            <ul>
              <li v-for="i in parsedRecipe.setupRequirements.length" :key="i">{{ parsedRecipe.setupRequirements[i - 1] }}</li>
            </ul>
          </div>
        </v-col>
        <v-col cols="9">
          <!-- Steps go here -->

          <div class="method">
            <h2>Steps</h2>
            <ol>
              <li v-for="i in parsedRecipe.steps.length" :key="i">
                <div class="step">
                  <p>{{ parsedRecipe.steps[i - 1].instructions }}</p>
                  <img v-bind:src="parsedRecipe.steps[i - 1].visuals" v-if="parsedRecipe.steps[i - 1].visuals" />
                </div>
              </li>
            </ol>
          </div>
        </v-col>
      </v-row>
    </v-container>
    <div class="base">
      <article class="timestamp">
        <p v-if="recipeDoc.dateCreated !== recipeDoc.dateUpdated">Edited on: {{ formatDate(recipeDoc.dateUpdated) }}</p>
        <p v-else>Created on: {{ formatDate(recipeDoc.dateCreated) }}</p>
      </article>
    </div>
  </div>
  <article v-else-if="loaded">
    <p>Recipe could not be loaded.</p>
  </article>
  <article v-else>
    <p>Loading...</p>
  </article>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Rubik");

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

.recipe {
  padding: 1rem;
  margin: 0 auto;
  max-width: 50em;
}

img {
  max-width: 30em;
}
.desc {
  font-size: 1.125rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}
hr {
  margin-bottom: 1rem;
}
h3 {
  margin-bottom: 1rem;
}

.ingredient {
  border-radius: 1em;
  background-color: wheat;
  padding: 1rem;
}
.ingredients {
  padding: 1rem;
  background-color: #081c33;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}
.ingredients ul li {
  list-style-position: inside;
  line-height: 1.4;
  margin-bottom: 1rem;
}
.method ol li {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  list-style-position: inside;
  border-bottom: 3px solid #eee;
}

.btn-edit {
  display: block;
  margin-left: auto;
}
</style>
