import type { EditorElement } from "../../types";
import { renderLibraryComponent } from "../../library/renderers";

interface Props {
  element: EditorElement;
  children?: React.ReactNode;
}

export function ElementRenderer({ element, children }: Props) {
  return <>{renderLibraryComponent(element.type, element.props, children)}</>;
}
