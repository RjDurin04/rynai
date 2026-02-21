"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check, Brain } from "lucide-react"

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard API may fail in certain contexts
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 opacity-0 group-hover/code:opacity-100"
            aria-label="Copy code"
        >
            {copied ? (
                <Check size={14} className="text-emerald-400" />
            ) : (
                <Copy size={14} className="text-muted-foreground" />
            )}
        </button>
    )
}

function ThoughtBlock({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-8 relative">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="relative border border-primary/10 bg-primary/[0.03] rounded-2xl p-5 md:p-6 overflow-hidden group/thought shadow-[inset_0_0_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <Brain size={12} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-primary/60">Thought Process</span>
                </div>
                <div className="text-[14px] text-foreground/60 leading-[1.8] font-medium italic selection:bg-primary/10 selection:text-primary">
                    {children}
                </div>
            </div>
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
    )
}

export function MarkdownRenderer({ content }: { content: string }) {
    // Check if the content contains <think> tags
    const hasThink = content.includes("<think>")

    if (!hasThink) {
        return <MarkdownContent content={content} />
    }

    // Split content by <think>...</think> tags
    const parts = content.split(/(<think>[\s\S]*?<\/think>)/g)

    return (
        <div className="space-y-4">
            {parts.map((part, index) => {
                if (part.startsWith("<think>")) {
                    const thoughtContent = part.replace(/^<think>|<\/think>$/g, "").trim()
                    if (!thoughtContent) return null
                    return <ThoughtBlock key={index}>{thoughtContent}</ThoughtBlock>
                }
                if (!part.trim()) return null
                return <MarkdownContent key={index} content={part} />
            })}
        </div>
    )
}

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    const codeString = String(children).replace(/\n$/, "")

                    if (match) {
                        return (
                            <div className="group/code relative my-6 md:rounded-xl rounded-none md:border border-y border-border bg-[#282c34] shadow-xl md:mx-0 -mx-4">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#21252b] border-b border-white/[0.05]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5 mr-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-destructive/40 border border-destructive/20" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/20" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
                                        </div>
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                                            {match[1]}
                                        </span>
                                    </div>
                                    <CopyButton text={codeString} />
                                </div>
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            padding: "1.25rem",
                                            background: "#282c34",
                                            fontSize: "13.5px",
                                            lineHeight: "1.8",
                                            borderRadius: 0,
                                            minWidth: "max-content",
                                        }}
                                    >
                                        {codeString}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <code
                            className="px-1.5 py-0.5 rounded-md bg-muted text-primary font-mono text-[13px] font-medium border border-border/50"
                            {...props}
                        >
                            {children}
                        </code>
                    )
                },
                p({ children }) {
                    return <p className="mb-5 last:mb-0 leading-[1.8] text-foreground/80">{children}</p>
                },
                h1({ children }) {
                    return <h1 className="text-2xl font-bold mb-6 mt-10 first:mt-0 text-foreground tracking-[-0.03em]">{children}</h1>
                },
                h2({ children }) {
                    return <h2 className="text-xl font-bold mb-5 mt-8 first:mt-0 text-foreground tracking-[-0.02em]">{children}</h2>
                },
                h3({ children }) {
                    return <h3 className="text-lg font-bold mb-4 mt-6 first:mt-0 text-foreground tracking-[-0.01em]">{children}</h3>
                },
                ul({ children }) {
                    return <ul className="list-disc list-inside mb-5 space-y-2 text-foreground/80">{children}</ul>
                },
                ol({ children }) {
                    return <ol className="list-decimal list-inside mb-5 space-y-2 text-foreground/80">{children}</ol>
                },
                li({ children }) {
                    return <li className="leading-[1.8]">{children}</li>
                },
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-2 border-emerald-500/20 pl-6 my-6 text-foreground/40 italic font-medium">
                            {children}
                        </blockquote>
                    )
                },
                a({ href, children }) {
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/20 hover:decoration-emerald-500/50 transition-all font-medium"
                        >
                            {children}
                        </a>
                    )
                },
                table({ children }) {
                    return (
                        <div className="my-8 overflow-hidden md:rounded-xl rounded-none border border-y border-border/50 bg-black/[0.02] shadow-sm max-w-full md:mx-0 -mx-4 border-x-0 md:border-x">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent max-w-full">
                                <table className="w-full text-sm border-collapse min-w-full">{children}</table>
                            </div>
                        </div>
                    )
                },
                thead({ children }) {
                    return <thead className="bg-muted/40 border-b border-border/50">{children}</thead>
                },
                th({ children }) {
                    return (
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                            {children}
                        </th>
                    )
                },
                td({ children }) {
                    return <td className="px-5 py-3.5 border-t border-border/30 text-foreground/70 leading-relaxed">{children}</td>
                },
                hr() {
                    return <hr className="my-10 border-white/[0.04]" />
                },
                strong({ children }) {
                    return <strong className="font-bold text-foreground font-semibold tracking-tight tracking-[-0.01em]">{children}</strong>
                },
                em({ children }) {
                    return <em className="italic text-foreground/60">{children}</em>
                },
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
