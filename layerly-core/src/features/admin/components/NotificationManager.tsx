'use client';

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  FileText,
  Info,
  Link as LinkIcon,
  Search,
  Send,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

type SimpleUser = {
  id: string;
  name: string | null;
  email: string;
};

const NOTIFICATION_TYPES = [
  { value: 'INFO', label: 'Info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  {
    value: 'SUCCESS',
    label: 'Success',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    value: 'WARNING',
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  { value: 'ERROR', label: 'Error', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  { value: 'SYSTEM', label: 'System', icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' },
];

export function NotificationManager() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);

  // Form State
  const [target, setTarget] = useState<'all' | 'user'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [type, setType] = useState('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const userSearchId = useId();
  const titleId = useId();
  const messageId = useId();
  const linkId = useId();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
        toastError('Failed to fetch user list');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [toastError]);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (target === 'user' && !selectedUserId) {
      toastError('Select a user');
      return;
    }
    if (!title || !message) {
      toastError('Fill in title and content');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          userId: target === 'user' ? selectedUserId : undefined,
          type,
          title,
          message,
          link,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      success('Notification sent successfully');
      // Reset form
      setTitle('');
      setMessage('');
      setLink('');
    } catch (error) {
      toastError('Error while sending');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const selectedTypeObj = NOTIFICATION_TYPES.find((t) => t.value === type) || NOTIFICATION_TYPES[0];
  const TypeIcon = selectedTypeObj.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Send notification
          </h2>

          <form onSubmit={handleSend} className="space-y-6">
            {/* Target Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTarget('user')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  target === 'user'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Single user</span>
              </button>
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  target === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="font-medium">All users</span>
              </button>
            </div>

            {/* User Selection (if target is user) */}
            {target === 'user' && (
              <div className="space-y-2">
                <label htmlFor={userSearchId} className="text-sm font-medium text-slate-700">
                  Select user
                </label>
                <div>
                  <Input
                    id={userSearchId}
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="mb-2"
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No results</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            selectedUserId === user.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sm text-slate-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                          {selectedUserId === user.id && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notification Type */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-700">Notification Type</span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {NOTIFICATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                      type === t.value
                        ? `${t.bg} ${t.color} border-${t.color.split('-')[1]}-200`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={titleId} className="text-sm font-medium text-slate-700">
                  Title
                </label>
                <Input
                  id={titleId}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New feature available"
                  required
                  leftIcon={<FileText className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={messageId} className="text-sm font-medium text-slate-700">
                  Message content
                </label>
                <textarea
                  id={messageId}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Enter notification content..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={linkId} className="text-sm font-medium text-slate-700">
                  Link (optional)
                </label>
                <Input
                  id={linkId}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /dashboard/settings"
                  leftIcon={<LinkIcon className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={sending} className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" />
                Send notification
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Column */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Preview
          </h3>

          <div className="bg-slate-100 p-8 rounded-xl flex justify-center items-center min-h-[200px] border border-slate-200 border-dashed">
            {/* Mock Dynamic Island */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 w-[320px] ring-1 ring-black/5">
                <div className={`p-2 rounded-full ${selectedTypeObj.bg}`}>
                  <TypeIcon className={`w-5 h-5 ${selectedTypeObj.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {title || 'Notification title'}
                  </h4>
                  <p className="text-xs text-slate-600 truncate">
                    {message || 'Notification content will appear here...'}
                  </p>
                </div>
              </div>
              <div className="text-center mt-4 text-xs text-slate-400">
                This is how the user will see it
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-500">
            <p className="mb-2">
              <strong className="text-slate-700">Tip:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Use <strong>System</strong> notifications for important messages
                technicznych.
              </li>
              <li>
                <strong>Info</strong> notifications are good for news.
              </li>
              <li>Avoid spamming users with too many notifications.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
