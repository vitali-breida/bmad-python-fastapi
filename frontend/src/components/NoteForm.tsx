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
        <label htmlFor="note-title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          maxLength={200}
          disabled={saving}
        />
        <FieldError message={fieldErrors.title} />
      </div>
      <div>
        <label htmlFor="note-body" className="block text-sm font-medium text-gray-700">
          Body
        </label>
        <textarea
          id="note-body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          maxLength={10000}
          disabled={saving}
        />
        <FieldError message={fieldErrors.body} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create note"}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          disabled={saving}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {secondaryLabel}
        </button>
      </div>
    </form>
  );
}
