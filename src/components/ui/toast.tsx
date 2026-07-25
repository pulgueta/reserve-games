import { Toast } from "@base-ui/react/toast";
import { CheckCircle, X, XCircle } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const manager = Toast.createToastManager();

export const toast = {
  success: (title: string) => manager.add({ title, type: "success" }),
  error: (title: string) => manager.add({ title, type: "error" }),
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          toast={t}
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg",
            "data-[type=success]:border-green-500/30 data-[type=success]:bg-green-50 data-[type=success]:text-green-900",
            "data-[type=error]:border-destructive/30 data-[type=error]:bg-destructive/5 data-[type=error]:text-destructive",
            "dark:data-[type=success]:bg-green-950 dark:data-[type=success]:text-green-100",
            "dark:data-[type=error]:bg-destructive/10",
          )}
        >
          {t.type === "success" && (
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
          )}
          {t.type === "error" && (
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          )}
          <Toast.Title className="flex-1 font-medium">{t.title}</Toast.Title>
          <Toast.Close className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 focus:outline-none">
            <X className="size-3.5" />
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={manager}>
      <Toast.Portal>
        <ToastList />
      </Toast.Portal>
    </Toast.Provider>
  );
}
