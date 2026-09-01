interface FeedbackProps {
  type: "success" | "error" | "loading";
  children: React.ReactNode;
}

export function Feedback({ type, children }: FeedbackProps) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    loading: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
