/**
 * Layerly design system – form classes (input, label, textarea).
 * Single place to avoid duplicating strings in components.
 * Consistent with .cursor/rules/layerly-design-system.mdc and /ui-kit.
 */

export const formLabelClass =
  'block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2';

export const formInputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all';

export const formInputErrorClass =
  'w-full bg-red-50 border border-red-300 rounded-xl px-4 py-3.5 font-medium text-red-900 focus:ring-4 focus:ring-red-500/20 outline-none transition-all';

export const formTextareaClass =
  formInputClass.replace('py-3.5', 'py-3.5 resize-none');
