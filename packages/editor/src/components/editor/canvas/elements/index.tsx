import type { EditorElement } from "../../types";
import { renderLibraryComponent } from "../../library/renderers";

interface Props {
  element: EditorElement;
  children?: React.ReactNode;
  zoom?: number;
  onSelect?: (id: string | null) => void;
  onUpdateProps?: (patch: Record<string, string | number | boolean>) => void;
  onUpdateElement?: (id: string, patch: Partial<EditorElement>) => void;
  previewing?: boolean;
  isSelected?: boolean;
}

export function ElementRenderer({ element, children, zoom, onSelect, onUpdateProps, onUpdateElement, previewing, isSelected }: Props) {
  return <>{renderLibraryComponent(element.type, element.props, children, { elementId: element.id, zoom, onSelect, onUpdateProps, onUpdateElement, previewing, isSelected })}</>;
}
