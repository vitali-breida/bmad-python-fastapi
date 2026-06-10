import { FieldError } from "./FieldError";
import type { FieldErrors } from "../api/errors";

type NoteFormProps = {
  title: string;
  body: string;
  fieldErrors: FieldErrors;
  isEditing: boolean;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
};

const inputClass =
  "mt-1 w-full rounded-md border border-surface-muted bg-surface-card px-3 py-2 text-sm shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

export function NoteForm({
  title,
  body,
  fieldErrors,
  isEditing,
  saving,
  onTitleChange,
  onBodyChange,
  onSubmit,
  secondaryLabel,
  onSecondary,
}: NoteFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor="note-title" className="block text-sm font-medium text-text">
          Title
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={inputClass}
          maxLength={200}
          disabled={saving}
        />
        <FieldError message={fieldErrors.title} />
      </div>
      <div>
        <label htmlFor="note-body" className="block text-sm font-medium text-text">
          Body
        </label>
        <textarea
          id="note-body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={6}
          className={inputClass}
          maxLength={10000}
          disabled={saving}
        />
        <FieldError message={fieldErrors.body} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create note"}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          disabled={saving}
          className="rounded-md border border-surface-muted bg-surface-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {secondaryLabel}
        </button>
      </div>
    </form>
  );
}
