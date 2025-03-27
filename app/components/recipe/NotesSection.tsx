import { RecipeNote } from "@/lib/types/recipe";
import { StickyNote } from "lucide-react";

interface NotesSectionProps {
  notes: RecipeNote[];
}

export default function NotesSection({ notes }: NotesSectionProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <StickyNote className="w-5 h-5 text-yellow-500" />
        Notes
      </h2>
      <div className="space-y-4">
        {notes.map((note, index) => (
          <div
            key={index}
            className="bg-yellow-50 p-4 rounded-lg border border-yellow-100"
          >
            {note.title && (
              <h3 className="font-medium text-yellow-800 mb-1">{note.title}</h3>
            )}
            <p className="text-yellow-700">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
