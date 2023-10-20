import { ObjectId } from "mongodb";
import { AccessControl, CollectionModeration, Friend, ParentshipManagement, Recipe, RecipeCollectionManagement, RecipeModeration, User, WebSession } from "./app";
import { ContentType } from "./concepts/access_control";
import { ManuallyEnteredRecipe, RecipeDoc } from "./concepts/recipe";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { Router, getExpressRouter } from "./framework/router";
import { parseInputAsObjectId } from "./parser";
import Responses from "./responses";

type RecipeWithModerator = RecipeDoc & { moderator: { username: string; _id: ObjectId; dateCreated: Date; dateUpdated: Date } };

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /**
   * Creates the recipe and gives the author (the user performing this action) both ownership of and
   * access to the recipe
   *
   * @param session
   * @param recipe JSON string parsable as a ManuallyEnteredRecipe
   * @returns the recipe object
   */
  @Router.post("/recipes")
  async createRecipe(session: WebSessionDoc, recipe: string) {
    // TODO: assert parameters parseable as json (includes not being unded)
    // later put in wrapper parse func that explains error
    // TODO: type check the input fields
    const parsedRecipe: ManuallyEnteredRecipe = JSON.parse(recipe);
    const recipeCreationResponse = await Recipe.create(parsedRecipe);
    const user = WebSession.getUser(session);
    await AccessControl.putAccess(user, recipeCreationResponse.recipeId, ContentType.RECIPE);
    await RecipeModeration.putParentship({ child: recipeCreationResponse.recipeId, parent: user }); // later: create function namses specific to this concept
    return recipeCreationResponse;
  }

  /**
   *
   *
   * @param session of a user with access to the recipe
   * @param _id the id of the recipe
   * @returns the `id` property of the response contains the ObjectId of the recipe's moderator
   */
  @Router.get("/recipes/:_id/moderators")
  async getModerator(session: WebSessionDoc, _id: string) {
    const parsedId: ObjectId = parseInputAsObjectId(_id); // TODO: handle _id parseable as ObjectId

    const moderatorId: ObjectId = await RecipeModeration.getModerator(parsedId);
    return { msg: "Success", id: moderatorId };
  }

  /**
   *
   *
   * @param session of a user with access to the recipe
   * @param _id the id of the recipe
   * @returns the properties of the recipe object
   */
  @Router.get("/recipes/:_id")
  async getRecipe(session: WebSessionDoc, _id: string) {
    const parsedId: ObjectId = parseInputAsObjectId(_id); // TODO: handle _id parseable as ObjectId

    const user = WebSession.getUser(session);
    await AccessControl.assertHasAccess(user, parsedId, ContentType.RECIPE);
    const recipe: RecipeDoc = await Recipe.getRecipeById(parsedId);
    const moderatorId = await RecipeModeration.getModerator(parsedId);
    const author = await User.getUserById(moderatorId);
    return { ...recipe, moderator: author };
  }

  /**
   *
   *
   * @param session of a user
   * @param _id the id of the recipe
   * @returns the recipes the user has access to
   */
  @Router.get("/recipes")
  async getAccessibleRecipes(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const accessibleRecipeIds: { _id: ObjectId }[] = (await AccessControl.getAccessibleContent(user, ContentType.RECIPE)).map((id) => {
      return { _id: id };
    });
    const recipeProcessess = (await Recipe.getRecipes({ $or: accessibleRecipeIds })).map(async (recipe: RecipeDoc) => {
      const moderatorId = await RecipeModeration.getModerator(recipe._id);
      const author = await User.getUserById(moderatorId);
      return { ...recipe, moderator: author };
    });

    const recipes: RecipeWithModerator[] = await Promise.all(recipeProcessess);

    return { msg: "Success", recipes: recipes };
  }

  /**
   * Creates the recipe collection and its corrsesponding access controls
   *
   * @param session
   * @param name the name of the recipe collection
   * @returns the created recipe collection object
   */
  @Router.post("/recipe_collections")
  async createRecipeCollection(session: WebSessionDoc, name: string) {
    const user = WebSession.getUser(session);
    const collectionCreationResponse = await RecipeCollectionManagement.createCollection(name);
    await AccessControl.putAccess(user, collectionCreationResponse.id, ContentType.COLLECTION);
    await CollectionModeration.putParentship({ child: collectionCreationResponse.id, parent: user });
    return collectionCreationResponse;
  }

  /**
   *
   * @param session
   * @param _id id of recipe collection
   * @returns the name of the recipe collection with the given id
   */
  @Router.get("/recipe_collections/:_id")
  async getRecipeCollectionName(session: WebSessionDoc, _id: string) {
    const parsedId: ObjectId = parseInputAsObjectId(_id); // TODO: handle _id parseable as ObjectId
    const user = WebSession.getUser(session);
    await AccessControl.assertHasAccess(user, parsedId, ContentType.COLLECTION);
    return await RecipeCollectionManagement.getCollectionById(parsedId);
  }

  /**
   * Uses the fields of `update` to overwrite the fields in the recipe whose id is `_id`
   *
   * @param session of a user who is the author of the recipe
   * @param _id
   * @param update
   * @return a message indicating successful update of the recipe (if successful)
   */
  @Router.patch("/recipes/:_id")
  async updateRecipe(session: WebSessionDoc, _id: string, update: string) {
    // note: it is required that update is string for lightweight front-end... else its fields (which are objects, but were rendered as strings by lightweight frontend) cant be parsed
    // authorship is implemented and validated by the "moderation" concept
    const user = WebSession.getUser(session);
    const parsedId: ObjectId = parseInputAsObjectId(_id);
    await AccessControl.assertHasAccess(user, parsedId, ContentType.RECIPE);
    const parsedUpdate: Partial<RecipeDoc> = JSON.parse(update);
    return await Recipe.update(parsedId, parsedUpdate);
  }

  /**
   *
   * @param session of a user with access to the collection
   * @param _id the id of the collection to which a recipe should be added
   * @param recipeId the id of the recipe to add to the collection
   */
  @Router.put("/recipe_collections/:_id/recipes")
  async addRecipeToCollection(session: WebSessionDoc, _id: string, recipeId: string) {
    const user = WebSession.getUser(session);
    const parsedRecipeId: ObjectId = parseInputAsObjectId(recipeId); // handle unparseable
    const parsedCollectionId: ObjectId = parseInputAsObjectId(_id); // handle unparseable
    await AccessControl.assertHasAccess(user, parsedRecipeId, ContentType.RECIPE);
    await AccessControl.assertHasAccess(user, parsedCollectionId, ContentType.COLLECTION);
    //assert content existence
    await Recipe.getRecipeById(parsedRecipeId);
    await RecipeCollectionManagement.getCollectionById(parsedCollectionId);

    await ParentshipManagement.putParentship({ child: parsedRecipeId, parent: parsedCollectionId });
    return { msg: "Recipe added!" };
  }

  /**
   *
   * @param session of a user who is the author of a recipe collection
   * @param _id the id of the collection
   * @param recipeId the id of the recipe to remove from the collection
   */
  @Router.delete("/recipe_collections/:_id/recipes/:recipeId")
  async removeRecipeFromCollection(session: WebSessionDoc, _id: string, recipeId: string) {
    const user = WebSession.getUser(session);
    const parsedRecipeId: ObjectId = parseInputAsObjectId(recipeId); // handle unparseable
    const parsedCollectionId: ObjectId = parseInputAsObjectId(_id); // handle unparseable
    await AccessControl.assertHasAccess(user, parsedRecipeId, ContentType.RECIPE);
    await AccessControl.assertHasAccess(user, parsedCollectionId, ContentType.COLLECTION);
    //assert content existence
    await Recipe.getRecipeById(parsedRecipeId);
    await RecipeCollectionManagement.getCollectionById(parsedCollectionId);

    return await ParentshipManagement.deleteRelationship(parsedRecipeId, parsedCollectionId);
  }

  /**
   *
   * @param session of a user with access to the recipe collection
   * @param _id the id of the RecipeCollection
   * @returns the properties of recipes existing in the collection
   */
  @Router.get("/recipe_collections/:_id")
  async getRecipesFromCollection(session: WebSessionDoc, _id: string) {
    const user = WebSession.getUser(session);
    const parsedCollectionId: ObjectId = parseInputAsObjectId(_id); // handle unparseable
    //assert content existence
    await RecipeCollectionManagement.getCollectionById(parsedCollectionId);

    await AccessControl.assertHasAccess(user, parsedCollectionId, ContentType.COLLECTION);
    const recipes: ObjectId[] = await ParentshipManagement.getAllChildren(parsedCollectionId);
    return { msg: "Success", recipes: recipes }; // LEFT OFF: Doesn't work anymore
  }

  /**
   *  Grants a user access to the recipe; can only be performed by author of recipe
   *
   * @param session
   * @param recipeId the id of the recipe
   * @param userId the id of the user who will be granted access to the recipe
   */
  @Router.put("/recipe_access_controls/users/:userId/accessibleContent")
  async grantUserAccessToRecipe(session: WebSessionDoc, recipeId: string, userId: string) {
    const user = WebSession.getUser(session);
    const parsedRecipeId: ObjectId = parseInputAsObjectId(recipeId); // TODO: handle _id parseable as ObjectId
    //assert content existence
    await Recipe.getRecipeById(parsedRecipeId);

    const parsedUserId: ObjectId = parseInputAsObjectId(userId);
    await User.userExists(parsedUserId);
    await RecipeModeration.assertIsModerator(parsedRecipeId, user);
    return await AccessControl.putAccess(parsedUserId, parsedRecipeId, ContentType.RECIPE);
  }

  /**
   * Users with access to a collection by default have access to all recipes that are in and subsequently added to
   * the collection; can only be performed by the recipe collection author
   *
   * @param session
   * @param _id the id of the collection
   * @param userId the id of the user who will be granted access to the collection
   */
  @Router.put("/collection_access_controls/users/:userId/accessibleContent")
  async grantUserAccessToCollection(session: WebSessionDoc, _id: string, userId: string) {
    const user = WebSession.getUser(session);
    const parsedCollectionId: ObjectId = parseInputAsObjectId(_id); // TODO: handle _id parseable as ObjectId
    //assert content existence
    await RecipeCollectionManagement.getCollectionById(parsedCollectionId);

    const parsedUserId: ObjectId = parseInputAsObjectId(userId);
    await User.userExists(parsedUserId);
    await CollectionModeration.assertIsModerator(parsedCollectionId, user);
    return await AccessControl.putAccess(parsedUserId, parsedCollectionId, ContentType.COLLECTION);
  }

  /**
   *
   * @param session
   * @param recipeId the id of the recipe
   * @param userId the id of the user whose access will be removed from the recipe
   */
  @Router.delete("/recipe_access_controls/users/:userId/accessibleContent/:recipeId")
  async removeUserAccessToRecipe(session: WebSessionDoc, recipeId: string, userId: string) {
    const user = WebSession.getUser(session);
    const parsedRecipeId: ObjectId = parseInputAsObjectId(recipeId); // TODO: handle _id parseable as ObjectId
    //assert content existence
    await Recipe.getRecipeById(parsedRecipeId);

    const parsedUserId: ObjectId = parseInputAsObjectId(userId);
    await User.userExists(parsedUserId);
    await RecipeModeration.assertIsModerator(parsedRecipeId, user);
    return await AccessControl.removeAccess(parsedUserId, parsedRecipeId, ContentType.RECIPE);
  }

  /**
   * Makes it so that the user with id `userId` no longer has access to the the recipe collection corresponding
   * to the access controller with id `_id`; can only be performed by the author of the recipe collection
   *
   * @param session
   * @param _id the id of the collection's access control
   * @param userId the id of the user whose access will be removed from the collection
   */
  @Router.delete("/collection_access_controls/users/:userId/accessibleContent/:_id")
  async removeUserAccessToRecipeCollection(session: WebSessionDoc, _id: string, userId: string) {
    const user = WebSession.getUser(session);
    const parsedCollectionId: ObjectId = parseInputAsObjectId(_id); // TODO: handle _id parseable as ObjectId
    //assert content existence
    await RecipeCollectionManagement.getCollectionById(parsedCollectionId);

    const parsedUserId: ObjectId = parseInputAsObjectId(userId);
    await User.userExists(parsedUserId);
    await CollectionModeration.assertIsModerator(parsedCollectionId, user);
    return await AccessControl.removeAccess(parsedUserId, parsedCollectionId, ContentType.COLLECTION);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }
}

export default getExpressRouter(new Routes());
