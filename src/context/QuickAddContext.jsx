import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import QuickAddModal from '../components/QuickAddModal.jsx';

const QuickAddContext = createContext(null);

export function QuickAddProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    type: 'expense',
    transaction: null,
  });

  const openQuickAdd = useCallback((options = {}) => {
    setState({
      open: true,
      type: options.transaction?.type || options.type || 'expense',
      transaction: options.transaction || null,
    });
  }, []);

  const closeQuickAdd = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);

  const value = useMemo(
    () => ({ openQuickAdd, closeQuickAdd, isOpen: state.open }),
    [openQuickAdd, closeQuickAdd, state.open],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddModal
        open={state.open}
        initialType={state.type}
        transaction={state.transaction}
        onClose={closeQuickAdd}
      />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) throw new Error('useQuickAdd must be used inside QuickAddProvider');
  return context;
}
