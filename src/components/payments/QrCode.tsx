import React, { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

type Props = {
  value: string;
  size?: number;
  label?: string;
  className?: string;
};

/** Renders a real, scannable QR code for a wallet address / payment URI. */
export default function QrCode({ value, size = 160, label, className }: Props) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!value) { setSrc(''); return; }
    QRCodeLib.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then((url) => { if (active) { setSrc(url); setFailed(false); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [value, size]);

  if (failed || !value) {
    return (
      <div
        className={`rounded-xl bg-[#0D0E12] border border-[#1E2027] flex items-center justify-center text-[10px] text-[#6B7280] ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        No address set
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white p-2 shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={label ?? 'Payment QR code'} width={size - 16} height={size - 16} className="w-full h-full" />
      ) : (
        <div className="w-full h-full animate-pulse bg-[#E4E4E7] rounded-md" />
      )}
    </div>
  );
}
