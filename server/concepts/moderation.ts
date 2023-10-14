import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";
import { FormattableError } from "../framework/router";
import { NotAllowedError } from "./errors";
import ParentConcept, { ParentShip } from "./parentship";

type UserContentObjectId = ObjectId;
type UserObjectId = ObjectId;

/**
 * ModerationRecord.author identifies the user who can manage access controls
 * to ModerationRecord.content
 */
export interface ModerationDoc extends BaseDoc {
  author: UserObjectId;
  content: UserContentObjectId;
}

export default class ModerationConcept extends ParentConcept {
  // later, instantiate parentconcept inside class, use own function names
  async assertIsModerator(child: ObjectId, parent: ObjectId) {
    const existingRelationships = await this.getParentships({ child, parent });
    if (existingRelationships.length === 0) {
      throw new NotAllowedError("Moderation permission missing.");
    }
  }

  /**
   *
   * @param parentShip
   * @returns an object whose property `recordId` contains the id of the ParentShip record that was created to hold
   * the information in `parentShip`
   */
  async putParentship(parentShip: ParentShip) {
    // ensure only one moderator per content
    const conflictingRecords = await this.getParentships({ child: parentShip.child, parent: { $not: { $eq: parentShip.parent } } });
    if (conflictingRecords.length > 0) throw new AlreadyExistsError("A moderator already exists.");
    const existing = await this.getParentships(parentShip);
    let _id: ObjectId;
    if (existing.length === 0) {
      _id = await this.parentships.createOne(parentShip);
    } else {
      _id = existing[0]._id;
    }
    return { msg: "User is now marked as the moderator.", recordId: _id };
  }

  /**
   * For any given value of `content` there is only one possible output;
   * @param content
   * @returns the ObjectId of the moderator of `content`
   */
  async getModerator(content: ObjectId): Promise<ObjectId> {
    const records = await this.parentships.readMany({ child: content });
    return records[0].parent;
  }

  // TODO: in getter methods, assert the following invariant: that the mapping from a child an authors/moderators is one to one
}

/**
 * Corresponds to the attempt to mark a user as a moderator of some content when a moderator already exists for that
 * content
 */
export class AlreadyExistsError extends FormattableError {
  public readonly HTTP_CODE = 400;
}
