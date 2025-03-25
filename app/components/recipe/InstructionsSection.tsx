"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { components } from "@/app/lib/types/openapi-generated";

type RecipeStep = components["schemas"]["RecipeStep"];

interface InstructionCardProps {
  instruction: RecipeStep;
  index: number;
}

const InstructionCard = ({ instruction, index }: InstructionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleted(!isCompleted);
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-100 shadow-sm overflow-hidden bg-white">
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
          isCompleted ? "bg-green-50 border-b border-green-100" : ""
        }`}
        onClick={toggleCompleted}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 flex items-center justify-center">
            <CheckCircle2
              size={24}
              className={`transition-all duration-300 ${
                isCompleted ? "text-green-500" : "text-gray-300"
              }`}
              fill={isCompleted ? "currentColor" : "none"}
            />
          </div>
          <h3
            className={`font-medium ${
              isCompleted ? "text-green-700 line-through" : "text-gray-800"
            }`}
          >
            {instruction.title ? instruction.title : `Step ${index + 1}`}
          </h3>
        </div>
        <div className="text-gray-400">
          {isCompleted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCompleted ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
        }`}
        style={{
          padding: isCompleted ? "0 16px 0 56px" : "16px 16px 16px 56px",
          overflow: "hidden",
        }}
      >
        <p className="text-gray-600">{instruction.text}</p>
      </div>
    </div>
  );
};

interface InstructionsSectionProps {
  instructions: RecipeStep[];
}

export default function InstructionsSection({
  instructions,
}: InstructionsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Instructions</h2>
      <div className="space-y-2">
        {instructions.map((instruction, index) => (
          <InstructionCard
            key={index}
            instruction={instruction}
            index={index}
          />
        ))}
        {instructions.map((instruction, index) => (
          <InstructionCard
            key={index}
            instruction={instruction}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
