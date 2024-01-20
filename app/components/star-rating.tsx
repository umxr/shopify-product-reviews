import React from "react";
import { StarFilledMinor } from "@shopify/polaris-icons";

type StarRatingProps = {
  reviews: number;
};

export const StarRating: React.FC<StarRatingProps> = ({ reviews }) => {
  if (!reviews) return null;
  const fullStars = Math.floor(reviews);
  return (
    <div>
      {Array(fullStars)
        .fill(null)
        .map((_, i) => (
          <StarFilledMinor
            key={`full-${i}`}
            height={24}
            width={24}
            fill="#FFE234"
            stroke="#FFE234"
          />
        ))}
    </div>
  );
};
