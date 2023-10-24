<script setup lang="ts">
import { reactive } from "vue";
import { Recipe, RenderForEditRecipe } from "../../interfaces/recipe";
import { fetchy } from "../../utils/fetchy";
import { formatDate } from "../../utils/formatDate";

const props = defineProps(["recipe"]);

function renderedToDocumentedRecipe(recipe: RenderForEditRecipe): Recipe {
  return {
    _id: recipe._id,
    dishName: recipe.dishName,
    outputSpecification: recipe.description,
    setupRequirements: recipe.ingredients,
    steps: recipe.stepInstructions.map((instructions, index) => {
      return { instructions: instructions, visuals: recipe.stepVisuals[index] };
    }),
  };
}

const recipeCopy: Recipe = JSON.parse(JSON.stringify(props.recipe));
const rec: RenderForEditRecipe = reactive({
  _id: recipeCopy._id,
  ingredientsRows: recipeCopy.setupRequirements ? recipeCopy.setupRequirements.length : 0,
  stepRows: recipeCopy.steps ? recipeCopy.steps.length : 0,
  dishName: recipeCopy.dishName ?? "untitled recipe",
  ingredients: recipeCopy.setupRequirements ?? [],
  description: recipeCopy.outputSpecification ?? "",
  stepInstructions: recipeCopy.steps ? recipeCopy.steps.map(({ instructions }) => instructions) : [],
  stepVisuals: recipeCopy.steps ? recipeCopy.steps.map(({ visuals }) => visuals) : [],
}); // placeholders!
const emit = defineEmits(["editPost", "refreshPosts"]);

const removeIngredient = (idx: number) => {
  rec.ingredients = rec.ingredients.filter((_, id: number) => id !== idx - 1);
  rec.ingredientsRows--;
};
const removeMethod = (idx: number) => {
  rec.stepInstructions = rec.stepInstructions.filter((_, id: number) => id !== idx - 1);
  rec.stepVisuals = rec.stepVisuals.filter((_, id: number) => id !== idx - 1);
  rec.stepRows--;
};

const addNewIngredient = () => {
  rec.ingredientsRows++;
};

const addNewMethod = () => {
  rec.stepRows++;
};

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
  <div class="add-recipe-popup">
    <div class="popup-content">
      <h2>Edit {{ rec.dishName }}</h2>
      <v-form @submit.prevent="editPost(JSON.stringify(renderedToDocumentedRecipe(rec)))">
        <menu>
          <li><button class="btn-small pure-button-primary pure-button" type="submit">Save</button></li>
          <li><button class="btn-small pure-button" @click="emit('editPost')">Cancel</button></li>
        </menu>
        <div class="group">
          <label>Title</label>
          <v-text-field type="text" v-model="rec.dishName" />
        </div>
        <div class="group">
          <label>Description</label>
          <textarea v-model="rec.description"></textarea>
        </div>
        <div class="group">
          <label>Ingredients</label>
          <div class="ingredient" v-for="i in rec.ingredientsRows" :key="i">
            <input type="text" v-model="rec.ingredients[i - 1]" />
            <v-btn @click="removeIngredient(i)">X</v-btn>
          </div>
          <v-btn type="button" @click="addNewIngredient">Add Ingredient</v-btn>
        </div>
        <div class="group">
          <label>Steps</label>
          <v-row class="method" v-for="i in rec.stepRows" :key="i">
            <v-col>
              <v-textarea label="Instructions" v-model="rec.stepInstructions[i - 1]"></v-textarea>
            </v-col>
            <v-col>
              <v-text-field label="Image Url (optional)" type="text" placeholder="image url" v-model="rec.stepVisuals[i - 1]" />
            </v-col>
            <v-col cols="1">
              <v-btn @click="removeMethod(i)">X</v-btn>
            </v-col>
          </v-row>
          <v-btn type="button" @click="addNewMethod">Add Step</v-btn>
        </div>
        <p v-if="props.recipe.dateCreated !== props.recipe.dateUpdated" class="timestamp">Edited on: {{ formatDate(props.recipe.dateUpdated) }}</p>
        <p v-else class="timestamp">Created on: {{ formatDate(props.recipe.dateCreated) }}</p>
      </v-form>
    </div>
  </div>
</template>

<style scoped>
menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}
.add-recipe-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.add-recipe-popup .popup-content {
  background-color: #fffce6;
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 768px;
  max-height: 75vh;
  overflow-y: auto;
}
.popup-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
.popup-content .group {
  margin-bottom: 1rem;
}
.popup-content .group label {
  display: block;
  margin-bottom: 0.5rem;
}
.popup-content .group input,
.popup-content .group textarea {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 1rem;
}
.popup-content .group textarea {
  height: 100px;
  resize: none;
}
.popup-content button[type="submit"] {
  margin-right: 1rem;
}

.buttons {
  display: flex;
  justify-content: flex-end;
}

.ingredient,
.method {
  display: flex;
  gap: 3rem;
  align-items: center;
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  font-size: 1.2em;
}

.ingredient div,
.method div {
  cursor: pointer;
  font-weight: 700;
  font-size: 24px;
}
</style>
