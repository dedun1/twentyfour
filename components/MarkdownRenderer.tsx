'use client';

import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={className} style={{ lineHeight: 1.75 }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--foreground)' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ marginBottom: '0.5rem', color: 'var(--foreground)', opacity: 0.9 }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingInlineStart: '1.25rem', marginBottom: '0.5rem', listStyleType: 'disc' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingInlineStart: '1.25rem', marginBottom: '0.5rem' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '0.2rem', color: 'var(--foreground)', opacity: 0.9 }}>
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: 'var(--foreground)' }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ color: 'var(--muted-fg)' }}>{children}</em>
          ),
          code: ({ children }) => (
            <code style={{
              background: 'rgba(31,41,55,0.8)',
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              fontSize: '0.875em',
              color: 'var(--primary)',
            }}>
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{
              borderInlineStart: '3px solid var(--primary)',
              paddingInlineStart: '0.75rem',
              marginBottom: '0.5rem',
              opacity: 0.8,
            }}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
