"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

export type ModalOptions = {
  title?: string;
  description?: string;
  content: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

type ModalContextType = {
  showModal: (options: ModalOptions) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const showModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setOptions(null), 300);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {options && (
          <DialogContent className={
            options.maxWidth === "sm" ? "sm:max-w-sm" :
            options.maxWidth === "md" ? "sm:max-w-md" :
            options.maxWidth === "lg" ? "sm:max-w-lg" :
            options.maxWidth === "xl" ? "sm:max-w-xl" :
            options.maxWidth === "2xl" ? "sm:max-w-2xl" :
            options.maxWidth === "full" ? "sm:max-w-[calc(100%-2rem)]" : ""
          }>
            {(options.title || options.description) && (
              <DialogHeader>
                {options.title && <DialogTitle>{options.title}</DialogTitle>}
                {options.description && <DialogDescription>{options.description}</DialogDescription>}
              </DialogHeader>
            )}
            {options.content}
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
}
