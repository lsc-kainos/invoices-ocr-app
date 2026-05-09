'use client';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

type Message = { id: string; role: 'USER' | 'ASSISTANT'; content: string };

export function ChatMessageContent({ message }: { message: Message }) {
  const isUser = message.role === 'USER';
  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${isUser ? 'bg-secondary' : 'bg-muted'}`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
