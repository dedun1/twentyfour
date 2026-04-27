'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, Send, Bot, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { Conversation, ConversationMessage } from '@/lib/types';

export default function InboxPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ti = t.inbox;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [search, setSearch] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      setConversations(data || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const loadMessages = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${selected.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ConversationMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selected || sending) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from('conversation_messages').insert({
      conversation_id: selected.id,
      sender: 'human',
      content: newMsg.trim(),
    });
    setNewMsg('');
    setSending(false);
  };

  const handleTakeOver = async (conv: Conversation) => {
    const supabase = createClient();
    const newVal = !conv.is_bot_active;
    await supabase.from('conversations').update({ is_bot_active: newVal }).eq('id', conv.id);
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, is_bot_active: newVal } : c));
    if (selected?.id === conv.id) {
      setSelected((prev) => prev ? { ...prev, is_bot_active: newVal } : prev);
    }
  };

  const filteredConvs = conversations.filter(
    (c) => !search || c.contact_name.toLowerCase().includes(search.toLowerCase()) || c.contact_phone.includes(search)
  );

  return (
    <RequireFeature feature="whatsapp">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ti.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'محادثات العملاء' : 'Client conversations'}
          </p>
        </div>
        {/* Action buttons go here */}
      </div>

      <div className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col">
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Conversations list */}
          <Card className="flex w-72 shrink-0 flex-col overflow-hidden p-0">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute inset-y-0 start-2.5 my-auto size-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ti.search} className="ps-8" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex justify-center py-8"><span className="spinner" /></div>
              ) : filteredConvs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{ti.noConversations}</p>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={cn(
                      'w-full border-b border-border px-3 py-3 text-start transition-colors hover:bg-accent',
                      selected?.id === conv.id && 'bg-primary/10'
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between">
                      <p className="truncate text-sm font-semibold">{conv.contact_name}</p>
                      <Badge className={cn('shrink-0 text-[10px]', conv.is_bot_active ? 'bg-primary/15 text-primary' : 'bg-blue-500/15 text-blue-500')}>
                        {conv.is_bot_active ? <Bot className="size-3" /> : <User className="size-3" />}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{conv.last_message || conv.contact_phone}</p>
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat area */}
          <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">{ti.selectConversation}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{selected.contact_name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{selected.contact_phone}</p>
                  </div>
                  <Button
                    variant={selected.is_bot_active ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleTakeOver(selected)}
                  >
                    {selected.is_bot_active ? <><User />{ti.takeOver}</> : <><Bot />{ti.handBack}</>}
                  </Button>
                </div>

                <div className={cn(
                  'border-b border-border px-4 py-1.5 text-xs',
                  selected.is_bot_active ? 'bg-primary/5 text-primary' : 'bg-blue-500/5 text-blue-500'
                )}>
                  {selected.is_bot_active ? (
                    <span className="flex items-center gap-1.5"><Bot className="size-3" /> {ti.botActive}</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><User className="size-3" /> {ti.humanActive}</span>
                  )}
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">{ti.noMessages}</p>
                    ) : (
                      messages.map((msg) => {
                        const isOutgoing = msg.sender !== 'client';
                        return (
                          <div key={msg.id} className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
                            <div className={cn(
                              'max-w-[75%] rounded-xl px-3 py-2',
                              msg.sender === 'bot' && 'bg-primary/10 text-primary',
                              msg.sender === 'human' && 'bg-blue-500/15 text-blue-500',
                              msg.sender === 'client' && 'bg-muted text-foreground'
                            )}>
                              <p className="text-sm">{msg.content}</p>
                              <p className="mt-0.5 text-[10px] opacity-60">
                                {msg.sender === 'bot' ? ti.bot : msg.sender === 'human' ? ti.human : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {!selected.is_bot_active && (
                  <div className="flex gap-2 border-t border-border p-3">
                    <Input
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={ti.typeMessage}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={!newMsg.trim() || sending}>
                      <Send />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
    </RequireFeature>
  );
}
