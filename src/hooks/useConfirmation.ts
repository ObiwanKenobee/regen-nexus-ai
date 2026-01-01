import { useState, useCallback } from 'react';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'destructive' | 'warning' | 'info';
  onConfirm: () => void;
}

const defaultState: ConfirmationState = {
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Confirm',
  variant: 'warning',
  onConfirm: () => {},
};

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>(defaultState);

  const confirm = useCallback(
    (options: {
      title: string;
      description: string;
      confirmText?: string;
      variant?: 'destructive' | 'warning' | 'info';
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || 'Confirm',
          variant: options.variant || 'warning',
          onConfirm: () => resolve(true),
        });
      });
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => ({ ...prev, isOpen: false }));
    }
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState(defaultState);
  }, [state]);

  return {
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    confirmText: state.confirmText,
    variant: state.variant,
    confirm,
    handleOpenChange,
    handleConfirm,
  };
};
