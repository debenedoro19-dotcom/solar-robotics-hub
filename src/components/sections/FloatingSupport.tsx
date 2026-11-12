import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import { useCustomerCare } from '@/lib/siteSettings';

export default function FloatingSupport() {
  const [chatOpen, setChatOpen] = useState(false);
  const care = useCustomerCare();


  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat bubble */}
      {chatOpen && (
        <div className="rounded-[8px] p-5 w-72 border border-border bg-card text-foreground shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0e9f6e] pulse-dot" />
              <span className="font-display text-sm font-semibold text-foreground">Trade Tesla Support</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Hi! How can we help you today?</p>
          <div className="space-y-2">
            <Link
              href="/support"
              onClick={() => setChatOpen(false)}
              className="flex items-center gap-2 w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity justify-center min-h-[44px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Submit a Support Ticket
            </Link>
            <Link
              href="/support"
              onClick={() => setChatOpen(false)}
              className="flex items-center gap-2 w-full py-2 px-4 bg-card border border-border text-muted-foreground font-medium rounded-xl text-sm hover:text-foreground hover:border-muted transition-colors justify-center min-h-[40px]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
              Track My Tickets
            </Link>
            {care.whatsappEnabled && care.whatsappNumber && (
              <a
                href={`https://wa.me/${care.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(care.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full py-2 px-4 bg-card border border-border text-muted-foreground font-medium rounded-xl text-sm hover:text-foreground hover:border-muted transition-colors justify-center min-h-[40px]"
              >
                WhatsApp Support
              </a>
            )}
            {care.telegramEnabled && care.telegramUsername && (
              <a
                href={`https://t.me/${care.telegramUsername.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full py-2 px-4 bg-card border border-border text-muted-foreground font-medium rounded-xl text-sm hover:text-foreground hover:border-muted transition-colors justify-center min-h-[40px]"
              >
                Telegram Support
              </a>
            )}
            {care.supportEmail && (
              <a
                href={`mailto:${care.supportEmail}`}
                className="flex items-center gap-2 w-full py-2 px-4 text-muted-foreground font-medium rounded-xl text-xs hover:text-foreground transition-colors justify-center"
              >
                {care.supportEmail}
              </a>
            )}
          </div>
          {care.supportHours && (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground text-center">{care.supportHours}</p>
          )}
        </div>
      )}


      {/* Live chat button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl hover:opacity-90 transition-all duration-300 border border-border"
        aria-label="Open support chat"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  );
}