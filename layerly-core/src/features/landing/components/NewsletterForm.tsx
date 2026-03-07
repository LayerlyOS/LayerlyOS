
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function NewsletterForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const schema = z.object({
    email: z.string().email('Invalid email address'),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale: 'en' }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const result = isJson ? await response.json() : { error: await response.text() };

      if (!response.ok) {
        throw new Error(result?.error || 'Something went wrong');
      }

      setIsSuccess(true);
      toast.success(result.message);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-green-50 border border-green-200 rounded-xl animate-in fade-in zoom-in duration-300">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-700 mb-2">Thanks!</h3>
        <p className="text-slate-600 text-sm">
          You&apos;re on the list. We&apos;ll notify you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm mx-auto space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Mail className="h-[18px] w-[18px] text-slate-400" />
        </div>
        <input
          {...register('email')}
          type="email"
          placeholder="Enter your email"
          disabled={isLoading}
          className={`w-full pl-11 pr-4 py-3 bg-white border ${
            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600 focus:border-blue-600'
          } rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 shadow-sm`}
        />
        {errors.email && (
          <p className="absolute -bottom-6 left-0 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md shadow-blue-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Join Waitlist</span>
        )}
      </button>
    </form>
  );
}
