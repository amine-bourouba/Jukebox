import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { snackbar } from '../services/snackbar';

interface SnackbarProps {
  message: string;
  color: string;
}

interface SnackbarContextType {
  showSnackbar: (props: SnackbarProps) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

interface SnackbarState extends SnackbarProps {
  isOpen: boolean;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbarElement, setSnackbarElement] = useState<SnackbarState>({
    isOpen: false,
    message: '',
    color: '',
  });

  const showSnackbar = useCallback((props: SnackbarProps) => {
    setSnackbarElement({
      isOpen: true,
      message: props.message,
      color: props.color,
    });

    setTimeout(() => {
      setSnackbarElement(prev => ({ ...prev, isOpen: false }));
    }, 2000);
  }, []);

  useEffect(() => {
    // Register the function with the global service
    snackbar.register(showSnackbar);
  }, [showSnackbar]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbarElement.isOpen && (
        <div
          className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg z-[10001] animate-slide-down ${snackbarElement.color}`}
        >
          <p className="text-white text-sm font-medium">{snackbarElement.message}</p>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}