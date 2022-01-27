import { VChildren, DomNode } from '@gera2ld/jsx-dom';

declare global {
  namespace JSX {
    type Element = VChildren; // Change to DomNode if jsxFactory is set to VM.hm
  }
}
