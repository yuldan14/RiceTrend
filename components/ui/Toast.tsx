"use client";

import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3200,
        className: "rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl",
        success: {
          icon: <CheckCircle2 className="h-5 w-5 text-brand-500" aria-hidden="true" />,
        },
        error: {
          icon: <XCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />,
        },
      }}
    />
  );
}

export const notifySuccess = (message: string) => toast.success(message);

export const notifyError = (message: string) => toast.error(message);

export const notifyInfo = (message: string) =>
  toast(message, {
    icon: <Info className="h-5 w-5 text-sky-400" aria-hidden="true" />,
  });

export default ToastProvider;
