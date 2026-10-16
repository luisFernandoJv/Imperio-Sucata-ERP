import { useCallback, useState } from "react";

export function useFormFeedback() {
  const [feedback, setFeedback] = useState(null);
  const toast = useCallback(
    (message) => setFeedback({ ...message, key: Date.now() }),
    [],
  );
  const dismiss = useCallback(() => setFeedback(null), []);
  return { toast, feedback, dismiss };
}
