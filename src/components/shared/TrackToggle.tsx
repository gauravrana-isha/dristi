interface Props {
  track: "hate" | "misinfo";
  onChange: (track: "hate" | "misinfo") => void;
}

export default function TrackToggle({ track, onChange }: Props) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Track filter">
      <button
        role="radio"
        aria-checked={track === "hate"}
        onClick={() => onChange("hate")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          track === "hate"
            ? "bg-danger text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        }`}
      >
        Hate Track
      </button>
      <button
        role="radio"
        aria-checked={track === "misinfo"}
        onClick={() => onChange("misinfo")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          track === "misinfo"
            ? "bg-warning text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        }`}
      >
        Misinfo Track
      </button>
    </div>
  );
}
