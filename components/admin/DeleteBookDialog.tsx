"use client";

import { useRef, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  bookTitle: string;
  onConfirm: () => Promise<{ success: boolean; message?: string }>;
}

// Native <dialog> gives Esc, backdrop and focus trapping without a new dependency.
const DeleteBookDialog = ({ bookTitle, onConfirm }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await onConfirm();

      if (result.success) {
        toast({ title: `"${bookTitle}" deleted` });
      } else {
        toast({
          title: `Could not delete "${bookTitle}"`,
          description: result.message,
          variant: "destructive",
        });
      }

      dialogRef.current?.close();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Delete ${bookTitle}`}
      >
        <TriangleAlert color="#ff0000" />
      </button>

      <dialog ref={dialogRef} className="confirm-dialog">
        <div className="confirm-content">
          <div className="confirm-illustration bg-red-100">
            <div className="bg-red-100">
              <TriangleAlert className="size-8 text-red-800" />
            </div>
          </div>

          <h2 className="mt-5 text-xl font-semibold text-dark-400">
            Delete this book?
          </h2>
          <p className="mt-1 text-center text-sm text-light-500">
            &ldquo;{bookTitle}&rdquo; will be removed from the library. Books
            with borrow or reading history cannot be deleted.
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Button
              type="button"
              className="confirm-btn confirm-approve"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Yes, delete it"}
            </Button>

            <Button
              type="button"
              className="confirm-btn confirm-reject"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default DeleteBookDialog;
