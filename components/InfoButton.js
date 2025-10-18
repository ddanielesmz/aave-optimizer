"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente pulsante informativo con tooltip/modal
 * @param {string} title - Titolo della spiegazione
 * @param {string|React.ReactNode} content - Contenuto della spiegazione
 * @param {string} className - Classi CSS aggiuntive
 * @param {string} size - Dimensione del pulsante (xs, sm, md, lg)
 */
export default function InfoButton({ 
  title = "Informazioni", 
  content, 
  className = "", 
  size = "xs" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure portal only renders on client to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!content) return null;

  return (
    <>
      {/* Pulsante "i" */}
      <button
        className={`btn btn-circle btn-ghost btn-${size} text-base-content/60 hover:text-base-content hover:bg-base-200 ${className}`}
        onClick={() => setIsOpen(true)}
        title={`Info about ${title}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          className="w-4 h-4 stroke-current"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Modal con informazioni (portaled to body to avoid parent transforms/overflow) */}
      {isClient && isOpen && createPortal(
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-base-100 rounded-2xl border border-base-300 shadow-lg p-6" role="dialog" aria-modal="true" aria-label={title}>
            <h3 className="text-base-content font-semibold tracking-tight mb-3 flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                className="w-4 h-4 stroke-current text-base-content/70"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {title}
            </h3>
            <div className="divider my-2"></div>
            <div className="text-sm text-base-content/80 leading-relaxed space-y-3">
              {typeof content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                content
              )}
            </div>
            
            <div className="modal-action mt-5">
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
          
          {/* Overlay per chiudere cliccando fuori */}
          <div 
            className="modal-backdrop bg-base-300/40 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
        </div>,
        document.body
      )}
    </>
  );
}
