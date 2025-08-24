"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    code: string;
    lang: string;
    className?: string;
    onChange?: (code: string) => void;
    isEditing?: boolean;
}

export const CodeView = ({ 
    code: initialCode, 
    lang, 
    className = "", 
    onChange, 
    isEditing = false 
}: Props) => {
    const codeRef = useRef<HTMLElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const langClass = `language-${lang}`;
    const [editableCode, setEditableCode] = useState(initialCode);

    useEffect(() => {
        setEditableCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditing && (e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                // Trigger save via custom event that parent can listen to
                const saveEvent = new CustomEvent('save-file');
                window.dispatchEvent(saveEvent);
            }
        };

        if (isEditing) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isEditing]);

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
                    codeRef.current.textContent = editableCode; // Use textContent instead of innerHTML for safety
                    
                    // Force re-highlight
                    Prism.highlightElement(codeRef.current);
                }
            } catch (error) {
                console.error(`Failed to load syntax highlighter for ${lang}:`, error);
                // Fallback: just show the code without highlighting
                if (codeRef.current) {
                    codeRef.current.textContent = editableCode;
                }
            }
        };

        // Only highlight when not editing to avoid conflicts
        if (!isEditing) {
            highlight();
        }
    }, [editableCode, lang, langClass, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCode = e.target.value;
        setEditableCode(newCode);
        onChange?.(newCode);
    };

    return (
        <div className={`code-view h-full ${className} relative`}>
            <div className="h-full">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={editableCode}
                        onChange={handleChange}
                        className="w-full h-full p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] border-0 focus:outline-none focus:ring-0 resize-none"
                        style={{
                            lineHeight: '1.6',
                            tabSize: 4,
                            fontFamily: 'Fira Code, Cascadia Code, Consolas, Monaco, Andale Mono, monospace',
                        }}
                        spellCheck={false}
                        autoFocus
                    />
                ) : (
                    <pre 
                        ref={preRef} 
                        className={`language-${lang} bg-[#1e1e1e] rounded-md m-0 text-sm font-mono overflow-auto p-4 h-full`}
                    >
                        <code 
                            ref={codeRef} 
                            className={langClass}
                        >
                            {editableCode}
                        </code>
                    </pre>
                )}
            </div>
        </div>
    );
};