import { X } from "lucide-react";

// React renders names and messages as text, including content from the database.
export function FormFeedback({ feedback, onDismiss }) {
  if (!feedback) return null;
  const danger = feedback.variant === "destructive";
  return (
    <div
      role={danger ? "alert" : "status"}
      className={`form-feedback flex items-start gap-3 rounded-lg border p-4 text-sm ${danger ? "border-red-200 bg-red-50 text-red-800" : "border-blue-200 bg-blue-50 text-blue-900"}`}
    >
      <div className="min-w-0 flex-1 break-words">
        <p className="font-semibold">{feedback.title}</p>
        {feedback.description && (
          <p className="mt-1 leading-relaxed">{feedback.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Fechar mensagem"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 focus-visible:outline focus-visible:outline-2"
      >
        <X size={18} />
      </button>
    </div>
  );
}
