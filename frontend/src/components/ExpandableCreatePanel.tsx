import type { FieldErrors } from "../api/errors";
import { NoteForm } from "./NoteForm";

type ExpandableCreatePanelProps = {
  expanded: boolean;
  title: string;
  body: string;
  fieldErrors: FieldErrors;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ExpandableCreatePanel({
  expanded,
  title,
  body,
  fieldErrors,
  saving,
  onTitleChange,
  onBodyChange,
  onSubmit,
  onCancel,
}: ExpandableCreatePanelProps) {
  if (!expanded) return null;

  return (
    <section
      aria-label="Create note"
      data-testid="create-panel"
      className="mb-6 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="mb-3 text-lg font-medium text-gray-900">New note</h2>
      <NoteForm
        title={title}
        body={body}
        fieldErrors={fieldErrors}
        isEditing={false}
        saving={saving}
        onTitleChange={onTitleChange}
        onBodyChange={onBodyChange}
        onSubmit={onSubmit}
        secondaryLabel="Cancel"
        onSecondary={onCancel}
      />
    </section>
  );
}
