"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Photo = { src: string; alt?: string };

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragX = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (photos.length < 2) return;
      const next = index + dir;
      if (next < 0 || next >= photos.length) return;
      setIndex(next);
    },
    [index, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    dragX.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      dragX.current = dx;
    }
  }
  function onTouchEnd() {
    const dx = dragX.current;
    touchStart.current = null;
    if (dx < -60) go(1);
    else if (dx > 60) go(-1);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={`${photo.src}-${i}`}
            type="button"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt || ""} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/92"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium">
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              aria-label="閉じる"
              onClick={close}
              className="rounded-full bg-white/10 px-3 py-1.5 text-lg leading-none hover:bg-white/20"
            >
              ×
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {photos.length > 1 && (
              <button
                type="button"
                aria-label="前の写真"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="absolute left-2 z-10 hidden rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25 disabled:opacity-30 sm:block"
              >
                ‹
              </button>
            )}
            <div
              className="flex h-full w-full items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[index].src}
                alt={photos[index].alt || ""}
                className="max-h-[85vh] max-w-[100vw] object-contain select-none"
                draggable={false}
              />
            </div>
            {photos.length > 1 && (
              <button
                type="button"
                aria-label="次の写真"
                onClick={() => go(1)}
                disabled={index === photos.length - 1}
                className="absolute right-2 z-10 hidden rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25 disabled:opacity-30 sm:block"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
