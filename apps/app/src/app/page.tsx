import { ToastProvider } from "@bluepen/editor/components/ui/toast";
import { Editor } from "@bluepen/editor";

export default function AppPage() {
  return (
    <ToastProvider position="top-center">
      <Editor />
    </ToastProvider>
  );
}
