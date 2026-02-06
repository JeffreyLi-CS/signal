"use client";

export function ImageLightbox({
  src,
  alt,
  onClose
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full border border-white/30 px-3 py-1 text-xs text-white"
      >
        Close
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full rounded-2xl object-contain"
      />
    </div>
  );
}
