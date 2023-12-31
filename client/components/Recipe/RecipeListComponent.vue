<script setup lang="ts">
import EditRecipeForm from "@/components/Recipe/EditRecipeForm.vue";
import RecipeComponent from "@/components/Recipe/RecipeComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import CreateRecipeForm from "./CreateRecipeForm.vue"; // TODO: use @?

const { isLoggedIn } = storeToRefs(useUserStore());

const loaded = ref(false);
let posts = ref<Array<Record<string, string>>>([]); //TODO: use static type checking e.g. Array<Record<string, string>>
let editing = ref("");
let searchAuthor = ref("");
const managingAccess = ref<boolean>(false);

async function getRecipes(author?: string) {
  let query: Record<string, string> = author !== undefined ? { author } : {};
  let postResults;
  try {
    postResults = await fetchy("api/recipes", "GET", { query });
  } catch (_) {
    return;
  }
  searchAuthor.value = author ? author : "";
  posts.value = postResults.recipes;
}

function updateEditing(id: string) {
  editing.value = id;
}

type RecipeIdentifier = { id: string; name: string };
const defaultRecipeIdentifier = { id: "", name: "" };

const objectOfAccessControl = ref<RecipeIdentifier>({ id: "", name: "(Press 'Manage access controls' on the desired recipe)" }); // the id of the recipe whose access is being controlled
const disableAccessControlButtons = ref<boolean>(true);

/**
 * Helps with loading a ui element that allows the user to manage the access controls for a given piece of user content
 *
 * @param id the id of the recipe whose access is being managed
 */
async function activateAccessManager(id: string) {
  objectOfAccessControl.value.id = id;
  if (id.length === 0) {
    disableAccessControlButtons.value = true;
    return;
  }
  disableAccessControlButtons.value = false;
  try {
    objectOfAccessControl.value.name = (await fetchy(`/api/recipes/${id}`, "GET")).dishName; // [UX] TODO: when the database updates, re-perform this call! e.g. if you update the name of the recipe in access controls
  } catch (_) {
    return;
  }
  managingAccess.value = true; // should await the text to load
}

function disactivateAccessManager() {
  managingAccess.value = false;
  objectOfAccessControl.value = defaultRecipeIdentifier;
  disableAccessControlButtons.value = true;
}

type AccessRequestInput = {
  subject: string; // the username of the person being granted access to an item of user content
  object: string; // the id of the recipe
};
async function grantSubjectAccessToObject(requestedAccessControl: AccessRequestInput) {
  // convert the subjectName to an id
  let subjectId: string = "";
  try {
    const subjectInfo = await fetchy(`api/users/${requestedAccessControl.subject}`, "GET");
    subjectId = subjectInfo._id;
  } catch (_) {
    return;
  }

  try {
    await fetchy(`api/recipe_access_controls/users/${subjectId}/accessibleContent`, "PUT", { body: { recipeId: requestedAccessControl.object } }); // TODO: display state of user access (whether they have it or not)
  } catch (_) {
    return;
  }
}

async function removeSubjectAccessToObject(requestedAccessControl: AccessRequestInput) {
  // convert the subjectName to an id
  let subjectId: string = "";
  try {
    const subjectInfo = await fetchy(`api/users/${requestedAccessControl.subject}`, "GET");
    subjectId = subjectInfo._id;
  } catch (_) {
    return;
  }

  try {
    await fetchy(`api/recipe_access_controls/users/${subjectId}/accessibleContent/${requestedAccessControl.object}`, "DELETE"); // TODO: display state of user access (whether they have it or not)
  } catch (_) {
    return;
  }
}

onBeforeMount(async () => {
  await getRecipes(); // TODO: Catch error from server when not logged in
  loaded.value = true;
});

const subjectOfAccessControlName = ref<string>(""); // the username of the user whose access is being changed
</script>

<template>
  <section v-if="isLoggedIn">
    <h2>Create a Recipe:</h2>
    <CreateRecipeForm @refreshPosts="getRecipes" />
  </section>

  <section class="existing-content">
    <section class="posts" v-if="loaded && posts.length !== 0">
      <article v-for="post in posts" :key="post._id">
        <RecipeComponent v-if="editing !== post._id" :recipe="post" @refreshPosts="getRecipes" @editPost="updateEditing" v-on:manage-access="activateAccessManager" />
        <EditRecipeForm v-else :recipe="post" @refreshPosts="getRecipes" @editPost="updateEditing" />
      </article>
    </section>
    <p v-else-if="loaded">No posts found</p>
    <p v-else>Loading...</p>
  </section>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.accessControlManager {
  max-width: 50em;
}

span {
  display: flex;
  max-width: none;
  justify-content: end;
}

section,
p,
.row {
  margin: 0 auto;
  max-width: 60em;
}

article {
  background-color: wheat;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

.posts {
  padding: 0.5em;
  flex-flow: row wrap;
  justify-content: flex-start;
  max-width: 100em;
}

.existing-content {
  display: flex;
  justify-content: center;
  max-width: 80em;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}
</style>
