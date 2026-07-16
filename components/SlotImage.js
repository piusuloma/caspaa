import { useState, useRef, useEffect } from 'react'

/* Was the image already known-broken before React attached its handlers?
   The markup is server-rendered, so a missing file errors during hydration —
   before onError is live — and the component would sit there showing the
   browser's broken-image glyph forever. A complete image with zero natural
   width is a load that already failed, so re-check once on mount. */
function useBrokenImage() {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  return [ref, failed, () => setFailed(true)]
}

/* An image slot that degrades to a labelled placeholder.
   While /public/images/<src> is missing, the box shows the filename and the
   size to supply, so every slot is visible and self-documenting on the page.
   Drop the file in at that path and it goes live with no code change. */
export default function SlotImage({
  src,
  alt,
  label,
  size,
  ratio = 'aspect-[4/3]',
  dark = false,
  rounded = 'rounded-2xl',
  className = '',
  imgClassName = '',
  ...rest
}) {
  const [ref, failed, fail] = useBrokenImage()

  if (failed) {
    return (
      <div
        className={`relative ${ratio} ${rounded} overflow-hidden border-2 border-dashed grid place-items-center text-center px-4 ${
          dark ? 'border-white/25 bg-white/5' : 'border-slate-300 bg-slate-100'
        } ${className}`}
        aria-hidden="true"
        {...rest}
      >
        <div>
          <svg
            viewBox="0 0 24 24"
            className={`w-7 h-7 mx-auto mb-2 ${dark ? 'text-white/40' : 'text-slate-400'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p className={`text-xs font-bold ${dark ? 'text-white/70' : 'text-slate-600'}`}>{label}</p>
          <p className={`mt-1 text-[11px] font-mono break-all ${dark ? 'text-white/45' : 'text-slate-400'}`}>
            {src.replace(/^\/images\//, '')}
          </p>
          {size && <p className={`text-[11px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>{size}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${ratio} ${rounded} overflow-hidden ${className}`} {...rest}>
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        onError={fail}
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    </div>
  )
}

/* Full-bleed background image for dark bands. A missing file simply leaves the
   flat navy behind it, so there is nothing to place-hold — the section is
   already complete without it. */
export function SlotBackdrop({ src, opacity = 'opacity-20' }) {
  const [ref, failed, fail] = useBrokenImage()
  if (failed) return null
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden="true"
      onError={fail}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${opacity}`}
    />
  )
}
