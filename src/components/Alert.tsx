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
          'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
          'transition-all duration-200',
          isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
          isSuccess
            ? 'border-emerald-200/50 bg-emerald-50/95 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/95 dark:text-emerald-300'
            : 'border-red-200/50 bg-red-50/95 text-red-800 dark:border-red-800/50 dark:bg-red-950/95 dark:text-red-300'
        )}
      >
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isSuccess
            ? 'bg-emerald-100 dark:bg-emerald-900/50'
            : 'bg-red-100 dark:bg-red-900/50'
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
          <p className="text-sm font-semibold">
            {isSuccess ? 'Succès' : 'Erreur'}
          </p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            isSuccess
              ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              : 'hover:bg-red-100 dark:hover:bg-red-900/50'
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
