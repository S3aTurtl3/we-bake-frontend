export interface RenderForEditRecipe {
  _id: string;
  dishName: string;
  description: string;
  ingredients: string[];
  stepInstructions: string[];
  stepVisuals: string[];
  ingredientsRows: number;
  stepRows: number;
}

export interface Recipe {
  _id: string;
  dishName: string;
  outputSpecification: string;
  setupRequirements: string[];
  steps: { instructions: string; visuals: string }[]; // TODO: cast as mediatype
}
