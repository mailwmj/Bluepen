import { ToastProvider } from "@outlin/editor/components/ui/toast";
import { Editor } from "@outlin/editor";

export default function AppPage() {
  return (
    <ToastProvider position="bottom-center">
      <Editor />
    </ToastProvider>
  );
}
