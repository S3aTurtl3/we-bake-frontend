export interface RenderForEditRecipe {
  _id: string;
  dishName: string;
  description: string;
  ingredients: string[];
  steps: string[]; // TODO: cast as mediatype
  ingredientsRows: number;
  stepRows: number;
}

export interface Recipe {
  _id: string;
  dishName: string;
  outputSpecification: string;
  ingredients: string[];
  steps: string[]; // TODO: cast as mediatype
}
