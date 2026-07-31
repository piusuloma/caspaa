import * as React from 'react';

/**
 * Centred dialog on a #102230 scrim.
 * @startingPoint section="App" subtitle="Modal, toast and empty state" viewport="700x340"
 */
export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Right-aligned action row: secondary Cancel then the primary action. */
  footer?: React.ReactNode;
  /** '' 560px · 'lg' 880px · 'xl' 1100px. */
  size?: '' | 'lg' | 'xl';
  onClose?: () => void;
}

export function Modal(props: ModalProps): JSX.Element | null;
