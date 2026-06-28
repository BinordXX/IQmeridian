'use client';

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ContactMessageStatus = 'NEW' | 'REVIEWED' | 'ARCHIVED';

type ContactMessage = {
  createdAt: string;
  email: string;
  enquiryType: string;
  fullName: string;
  id: string;
  message: string;
  organisation?: string | null;
  status: ContactMessageStatus;
  updatedAt: string;
};

type ContactMessageListResponse = {
  items: ContactMessage[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const statusOptions: Array<{
  label: string;
  value: ContactMessageStatus | 'ALL';
}> = [
  {
    label: 'All',
    value: 'ALL',
  },
  {
    label: 'New',
    value: 'NEW',
  },
  {
    label: 'Reviewed',
    value: 'REVIEWED',
  },
  {
    label: 'Archived',
    value: 'ARCHIVED',
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusClassName(status: ContactMessageStatus) {
  if (status === 'NEW') {
    return 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100';
  }

  if (status === 'REVIEWED') {
    return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
  }

  return 'border-slate-400/20 bg-white/[0.04] text-slate-300';
}

function getReadableError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const message = record.message;

  return typeof message === 'string' ? message : fallback;
}

export function ContactMessageInbox() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'ALL'>(
    'NEW',
  );
  const [query, setQuery] = useState('');
  const [pageState, setPageState] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loadingState, setLoadingState] = useState<
    'idle' | 'loading' | 'updating'
  >('loading');
  const [error, setError] = useState<string | null>(null);

  const isLoading = loadingState === 'loading';
  const isUpdating = loadingState === 'updating';

  const selectedPreview = useMemo(() => {
    if (!selectedMessage) {
      return null;
    }

    return selectedMessage.message.length > 900
      ? `${selectedMessage.message.slice(0, 900)}…`
      : selectedMessage.message;
  }, [selectedMessage]);

  async function loadMessages() {
    setLoadingState('loading');
    setError(null);

    const params = new URLSearchParams();

    params.set('page', String(pageState.page));
    params.set('pageSize', String(pageState.pageSize));

    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }

    if (query.trim()) {
      params.set('query', query.trim());
    }

    try {
      const response = await fetch(
        `/api/internal/contact-messages?${params.toString()}`,
        {
          cache: 'no-store',
        },
      );

      const payload = (await response.json()) as
        | ContactMessageListResponse
        | unknown;

      if (!response.ok) {
        setError(getReadableError(payload, 'Contact messages could not load.'));
        setLoadingState('idle');
        return;
      }

      const listPayload = payload as ContactMessageListResponse;

      setMessages(listPayload.items);
      setPageState({
        page: listPayload.page,
        pageSize: listPayload.pageSize,
        total: listPayload.total,
        totalPages: listPayload.totalPages,
      });
      setSelectedMessage((current) => {
        if (!current) {
          return listPayload.items[0] ?? null;
        }

        return (
          listPayload.items.find((message) => message.id === current.id) ??
          listPayload.items[0] ??
          null
        );
      });
      setLoadingState('idle');
    } catch {
      setError('Unable to reach the contact-message inbox.');
      setLoadingState('idle');
    }
  }

  async function updateSelectedStatus(status: ContactMessageStatus) {
    if (!selectedMessage || isUpdating) {
      return;
    }

    setLoadingState('updating');
    setError(null);

    try {
      const response = await fetch(
        `/api/internal/contact-messages/${selectedMessage.id}/status`,
        {
          body: JSON.stringify({
            status,
          }),
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        },
      );

      const payload = (await response.json()) as
        | { status?: ContactMessageStatus; updatedAt?: string }
        | unknown;

      if (!response.ok) {
        setError(getReadableError(payload, 'Message status could not update.'));
        setLoadingState('idle');
        return;
      }

      const updatePayload = payload as {
        status?: ContactMessageStatus;
        updatedAt?: string;
      };

      const updatedMessage = {
        ...selectedMessage,
        status: updatePayload.status ?? status,
        updatedAt: updatePayload.updatedAt ?? selectedMessage.updatedAt,
      };

      setSelectedMessage(updatedMessage);
      setMessages((current) =>
        current.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message,
        ),
      );
      setLoadingState('idle');
    } catch {
      setError('Unable to update this contact message.');
      setLoadingState('idle');
    }
  }

  useEffect(() => {
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState.page, statusFilter]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageState((current) => ({
      ...current,
      page: 1,
    }));

    void loadMessages();
  }

  return (
    <main className="min-h-screen bg-[#020817] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(3,7,18,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                Platform admin
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                Contact message inbox
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Review public enquiries submitted from the IQMeridian contact
                page. Messages can be marked reviewed or archived after handling.
              </p>
            </div>

            <button
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => void loadMessages()}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <form className="flex gap-3" onSubmit={handleSearchSubmit}>
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Search className="text-slate-500" size={18} />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, organisation, or message"
                  value={query}
                />
              </div>
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.1]"
                type="submit"
              >
                Search
              </button>
            </form>

            <select
              className="rounded-2xl border border-white/10 bg-[#07142f] px-4 py-3 text-sm font-bold text-white outline-none"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ContactMessageStatus | 'ALL',
                )
              }
              value={statusFilter}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035]">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Inbox className="text-cyan-300" size={18} />
                    Messages
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {pageState.total} total
                  </p>
                </div>
              </div>

              <div className="max-h-[42rem] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm text-slate-400">
                    <Loader2 className="animate-spin" size={18} />
                    Loading messages
                  </div>
                ) : messages.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Inbox className="mx-auto text-slate-600" size={30} />
                    <p className="mt-3 text-sm font-semibold text-slate-300">
                      No messages found.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Try another status filter or search query.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const selected = selectedMessage?.id === message.id;

                    return (
                      <button
                        className={[
                          'block w-full border-b border-white/10 px-5 py-4 text-left transition last:border-b-0',
                          selected
                            ? 'bg-cyan-400/10'
                            : 'hover:bg-white/[0.04]',
                        ].join(' ')}
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">
                              {message.fullName}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <Mail size={13} />
                              {message.email}
                            </p>
                          </div>
                          <span
                            className={[
                              'rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em]',
                              getStatusClassName(message.status),
                            ].join(' ')}
                          >
                            {message.status}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">
                          {message.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-cyan-200">
                            {message.enquiryType}
                          </span>
                          <span className="text-[0.7rem] text-slate-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6">
              {selectedMessage ? (
                <div>
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                        Selected enquiry
                      </p>
                      <h2 className="mt-3 text-2xl font-black text-white">
                        {selectedMessage.fullName}
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        {selectedMessage.email}
                      </p>
                      {selectedMessage.organisation ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedMessage.organisation}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={[
                        'w-fit rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]',
                        getStatusClassName(selectedMessage.status),
                      ].join(' ')}
                    >
                      {selectedMessage.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        Enquiry type
                      </p>
                      <p className="mt-2 text-sm font-bold text-white">
                        {selectedMessage.enquiryType}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        Submitted
                      </p>
                      <p className="mt-2 text-sm font-bold text-white">
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#07142f]/70 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                      Message
                    </p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {selectedPreview}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={
                        isUpdating || selectedMessage.status === 'REVIEWED'
                      }
                      onClick={() => void updateSelectedStatus('REVIEWED')}
                      type="button"
                    >
                      {isUpdating ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}
                      Mark reviewed
                    </button>

                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300/20 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={
                        isUpdating || selectedMessage.status === 'ARCHIVED'
                      }
                      onClick={() => void updateSelectedStatus('ARCHIVED')}
                      type="button"
                    >
                      {isUpdating ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <Archive size={17} />
                      )}
                      Archive
                    </button>

                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                      href={`mailto:${selectedMessage.email}`}
                    >
                      <Mail size={17} />
                      Reply by email
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[24rem] items-center justify-center text-center">
                  <div>
                    <Inbox className="mx-auto text-slate-600" size={34} />
                    <p className="mt-4 text-sm font-semibold text-slate-300">
                      Select a message.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Message details will appear here.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}