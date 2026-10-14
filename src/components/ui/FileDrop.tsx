import { Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import { cn } from './styles';

export interface FileDropProps {
  /** e.g. "image/jpeg,image/png,image/webp" */
  accept: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}

/**
 * Drop zone that is also a normal file input, so a tap on mobile opens the file picker.
 * Files are handed to the caller; nothing is uploaded.
 */
export function FileDrop({
  accept,
  multiple = false,
  label = 'Choose files or drop them here',
  hint,
  onFiles,
}: FileDropProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(multiple ? Array.from(list) : [list[0]]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    handle(event.dataTransfer.files);
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 motion-reduce:transition-none',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20'
          : 'border-slate-300 hover:border-brand-400 dark:border-slate-700',
      )}
    >
      <Upload className="size-6 text-brand-600 dark:text-brand-300" aria-hidden="true" />
      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
      {hint && <span className="text-sm text-slate-500 dark:text-slate-400">{hint}</span>}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          handle(event.target.files);
          // Allow choosing the same file again.
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </label>
  );
}
