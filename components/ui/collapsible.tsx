'use client';

import * as React from 'react';

type CollapsibleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used inside Collapsible');
  }
  return context;
}

function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const resolvedOpen = open ?? internalOpen;

  const setOpen = React.useCallback((nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [onOpenChange, open]);

  return (
    <CollapsibleContext.Provider value={{ open: resolvedOpen, setOpen }}>
      <div data-slot="collapsible" data-state={resolvedOpen ? 'open' : 'closed'} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useCollapsibleContext();

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? 'open' : 'closed'}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(!open);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function CollapsibleContent({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useCollapsibleContext();
  if (!open) return null;

  return (
    <div data-slot="collapsible-content" data-state={open ? 'open' : 'closed'} {...props}>
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
