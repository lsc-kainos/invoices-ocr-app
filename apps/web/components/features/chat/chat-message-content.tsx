'use client';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Sparkles } from 'lucide-react';

type Message = { id: string; role: 'USER' | 'ASSISTANT'; content: string };

export function ChatMessageContent({ message }: { message: Message }) {
  const isUser = message.role === 'USER';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="from-primary/30 to-primary/10 ring-primary/20 mt-1 mr-2 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-1 sm:flex">
          <Sparkles className="text-primary/80 h-3 w-3" />
        </div>
      )}
      <div
        className={`max-w-[92%] sm:max-w-[80%] ${
          isUser
            ? 'bg-primary/10 border-primary/20 rounded-2xl rounded-tr-sm border px-3.5 py-2 sm:px-4 sm:py-2.5'
            : 'px-1 py-1'
        }`}
      >
        {isUser ? (
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-foreground mb-2 font-serif text-lg italic">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-foreground mb-2 font-serif text-base italic">{children}</h2>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code
                      className="border-border/30 text-primary/90 rounded border bg-black/40 px-1.5 py-0.5 font-mono text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="border-border/30 my-3 overflow-x-auto rounded-lg border bg-black/40 p-3">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => (
                  <ul className="[li]:marker:text-primary/60 my-2 space-y-1">{children}</ul>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
