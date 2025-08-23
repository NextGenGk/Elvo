"use client";

import { useEffect, useRef } from "react";
import "./code-theme.css";

interface Props {
    code: string;
    lang: string;
    className?: string;
}

export const CodeView = ({ code, lang, className = "" }: Props) => {
    const codeRef = useRef<HTMLElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const langClass = `language-${lang}`;

    useEffect(() => {
        // Only run on client-side
        if (typeof window === 'undefined') return;

        const highlight = async () => {
            try {
                // Import Prism and required languages
                const Prism = (await import("prismjs")).default;
                
                // Dynamically load required language components with proper dependencies
                const langMap: Record<string, () => Promise<void>> = {
                    'typescript': async () => {
                        await import("prismjs/components/prism-javascript");
                        await import("prismjs/components/prism-typescript");
                    },
                    'ts': async () => {
                        await import("prismjs/components/prism-javascript");
                        await import("prismjs/components/prism-typescript");
                    },
                    'javascript': async () => {
                        await import("prismjs/components/prism-javascript");
                    },
                    'js': async () => {
                        await import("prismjs/components/prism-javascript");
                    },
                    'tsx': async () => {
                        await import("prismjs/components/prism-javascript");
                        await import("prismjs/components/prism-typescript");
                        await import("prismjs/components/prism-jsx");
                        await import("prismjs/components/prism-tsx");
                    },
                    'jsx': async () => {
                        await import("prismjs/components/prism-javascript");
                        await import("prismjs/components/prism-jsx");
                    },
                    'json': async () => {
                        await import("prismjs/components/prism-json");
                    },
                    'css': async () => {
                        await import("prismjs/components/prism-css");
                    },
                    'html': async () => {
                        await import("prismjs/components/prism-markup");
                    },
                    'xml': async () => {
                        await import("prismjs/components/prism-markup");
                    },
                    'bash': async () => {
                        await import("prismjs/components/prism-bash");
                    },
                    'shell': async () => {
                        await import("prismjs/components/prism-bash");
                    },
                    'python': async () => {
                        await import("prismjs/components/prism-python");
                    },
                    'py': async () => {
                        await import("prismjs/components/prism-python");
                    },
                    'markdown': async () => {
                        await import("prismjs/components/prism-markdown");
                    },
                    'yaml': async () => {
                        await import("prismjs/components/prism-yaml");
                    },
                    'sql': async () => {
                        await import("prismjs/components/prism-sql");
                    },
                    'php': async () => {
                        await import("prismjs/components/prism-php");
                    },
                    'ruby': async () => {
                        await import("prismjs/components/prism-ruby");
                    },
                    'go': async () => {
                        await import("prismjs/components/prism-go");
                    },
                    'rust': async () => {
                        await import("prismjs/components/prism-rust");
                    },
                    'java': async () => {
                        await import("prismjs/components/prism-java");
                    },
                    'c': async () => {
                        await import("prismjs/components/prism-c");
                    },
                    'cpp': async () => {
                        await import("prismjs/components/prism-cpp");
                    },
                };

                // Load the language if it exists in our map
                if (langMap[lang]) {
                    await langMap[lang]();
                }
                
                if (codeRef.current) {
                    // Clear any existing highlighting
                    codeRef.current.className = langClass;
                    codeRef.current.textContent = code; // Use textContent instead of innerHTML for safety
                    
                    // Force re-highlight
                    Prism.highlightElement(codeRef.current);
                }
            } catch (error) {
                console.error(`Failed to load syntax highlighter for ${lang}:`, error);
                // Fallback: just show the code without highlighting
                if (codeRef.current) {
                    codeRef.current.textContent = code;
                }
            }
        };

        highlight();
    }, [code, lang, langClass]);

    return (
        <div className={`code-view h-full ${className}`}>
            <pre 
                ref={preRef} 
                className={`language-${lang} bg-background text-foreground rounded-md m-0 text-sm font-mono overflow-auto p-4 h-full`}
            >
                <code 
                    ref={codeRef} 
                    className={langClass}
                    style={{
                        background: 'transparent',
                        color: 'inherit',
                    }}
                >
                    {code}
                </code>
            </pre>
        </div>
    );
};