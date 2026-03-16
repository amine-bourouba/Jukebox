import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmationModalProps {
  title: string;
  content: string;
}

interface ConfirmationContextType {
  showConfirmation: (props: ConfirmationModalProps) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

interface ConfirmationState extends ConfirmationModalProps {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

export function ConfirmationModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    content: '',
    resolve: () => {},
  });

  const showConfirmation = useCallback((props: ConfirmationModalProps): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({
        isOpen: true,
        title: props.title,
        content: props.content,
        resolve,
      });
    });
  }, []);
// TODO: TEST THE NEW MODAL
  const handleConfirm = useCallback(() => {
    confirmation.resolve(true);
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, [confirmation]);

  const handleCancel = useCallback(() => {
    confirmation.resolve(false);
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, [confirmation]);

  return (
    <ConfirmationContext.Provider value={{ showConfirmation }}>
      {children}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-br from-midnight via-sapphire to-amethyst border border-white/10 rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-3">
              {confirmation.title}
            </h3>
            <p className="text-gray-300 mb-6">
              {confirmation.content}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationModalProvider');
  }
  return context;
}
