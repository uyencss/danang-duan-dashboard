"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

export type AlertOptions = {
  title: string;
  description?: string;
  type?: "info" | "success" | "error" | "warning";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (options?.onConfirm) options.onConfirm();
    setTimeout(() => setOptions(null), 300);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setTimeout(() => setOptions(null), 300);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        {options && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
            </AlertDialogHeader>
            <AlertDialogFooter>
              {options.showCancel !== false && (
                 <AlertDialogCancel onClick={handleCancel}>{options.cancelText || "Hủy"}</AlertDialogCancel>
              )}
               <div onClick={handleConfirm}>
                 <AlertDialogAction>{options.confirmText || "Đồng ý"}</AlertDialogAction>
               </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within an AlertProvider");
  return context;
}
