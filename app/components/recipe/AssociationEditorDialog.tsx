import { useState } from "react";
import { RecipeStep, ApiIngredient } from "@/lib/types/recipe";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import AssociationEditor from "./AssociationEditor";

interface AssociationEditorDialogProps {
  ingredients: ApiIngredient[];
  instructions: RecipeStep[];
  associations: IngredientAssociation[];
  onSave: (associations: IngredientAssociation[]) => Promise<void>;
}

export default function AssociationEditorDialog({
  ingredients,
  instructions,
  associations,
  onSave,
}: AssociationEditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async (newAssociations: IngredientAssociation[]) => {
    await onSave(newAssociations);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings2 className="mr-2 h-4 w-4" />
          Edit Associations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Edit Ingredient Associations</DialogTitle>
          <DialogDescription>
            Select an ingredient, then highlight text in a step to create an
            association.
          </DialogDescription>
        </DialogHeader>

        <AssociationEditor
          ingredients={ingredients}
          instructions={instructions}
          initialAssociations={associations}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
