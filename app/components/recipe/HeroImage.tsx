import Image from "next/image";
import { recipeImageUrl } from "@/lib/utils/url";

interface HeroImageProps {
  recipeId: string;
  recipeName: string;
}

export default function HeroImage({ recipeId, recipeName }: HeroImageProps) {
  return (
    <div className="relative h-[40vh] w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
      <Image
        src={recipeImageUrl(recipeId)}
        alt={recipeName}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
        <h1 className="text-4xl font-bold text-white mb-2">{recipeName}</h1>
      </div>
    </div>
  );
}
