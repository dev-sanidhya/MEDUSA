"use client";

import { useState } from "react";

interface Props {
  title: string;
  body: string;
  tagOptions: Array<{
    id: string;
    label: string;
  }>;
  submitLabel: string;
  onSubmit: (payload: { rating: number; tags: string[] }) => Promise<void>;
}

const RATING_LABELS = [
  "Missed",
  "Weak",
  "Fine",
  "Strong",
  "Excellent",
];

export function FeedbackPanel({
  title,
  body,
  tagOptions,
  submitLabel,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag]
    );
  };

  const handleSubmit = async () => {
    if (!rating || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        rating,
        tags: selectedTags,
      });
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-[2rem] p-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rose-strong)]">{title}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-main)]">{body}</p>

      {isSubmitted ? (
        <div className="mt-5 rounded-[1.35rem] border border-emerald-500/18 bg-emerald-500/[0.06] px-5 py-4 text-sm text-emerald-900/80">
          Saved. MEDUSA will use this to sharpen future recommendations.
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {RATING_LABELS.map((label, index) => {
              const value = index + 1;
              const isActive = rating === value;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] text-[var(--rose-strong)]"
                      : "border-[var(--border-subtle)] bg-white/76 text-[var(--text-main)] hover:border-[var(--border-strong)] hover:bg-white"
                  }`}
                >
                  {value}. {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const isActive = selectedTags.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                    isActive
                      ? "border-[var(--border-strong)] bg-white text-[var(--text-strong)]"
                      : "border-[var(--border-subtle)] bg-white/74 text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-white"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!rating || isSubmitting}
              className="medusa-button-primary px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
