'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { clear } from '@/lib/store/slices/alertSlice';
import { cn } from '@/lib/utils';

export function Alert() {
  const { message, type } = useSelector((state: RootState) => state.alert);
  const dispatch = useDispatch<AppDispatch>();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          dispatch(clear());
          setIsVisible(false);
        }, 200);
      }, 4800);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      dispatch(clear());
      setIsVisible(false);
    }, 200);
  };

  if (!message || !isVisible) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl',
          'transition-all duration-200',
          isExiting ? 'anim-slide-out-right' : 'anim-slide-in-right',
          isSuccess
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        )}
      >
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isSuccess
            ? 'bg-emerald-500/20'
            : 'bg-red-500/20'
        )}>
          {isSuccess ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="flex-1 pr-2">
          <p className="text-sm font-medium">
            {isSuccess ? 'Succes' : 'Erreur'}
          </p>
          <p className="text-sm opacity-80">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            isSuccess
              ? 'hover:bg-emerald-500/20'
              : 'hover:bg-red-500/20'
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
