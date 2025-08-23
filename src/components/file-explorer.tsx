"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { CopyIcon, CopyCheckIcon } from "lucide-react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code-view";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from "./ui/breadcrumb";

type FileCollection = { [path: string]: string };

function getLanguageFromExtension(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'json': 'json',
        'css': 'css',
        'scss': 'css',
        'sass': 'css',
        'html': 'html',
        'htm': 'html',
        'xml': 'xml',
        'py': 'python',
        'sh': 'bash',
        'bash': 'bash',
        'zsh': 'bash',
        'fish': 'bash',
        'md': 'markdown',
        'markdown': 'markdown',
        'yml': 'yaml',
        'yaml': 'yaml',
        'sql': 'sql',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp'
    };

    return languageMap[extension || ''] || 'text';
}

interface FileBreadcrumbProps {
    filePath: string;
}

const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
    const pathSegments = filePath.split("/")
    const maxSegments = 4

    const renderBreadcrumbItems = () => {
        if (pathSegments.length <= maxSegments) {
            return pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1

                return (
                    <Fragment key={index}>
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage className="font-medium">
                                    {segment}
                                </BreadcrumbPage>
                            ) : (
                                <span className="text-muted-foreground">{segment}</span>
                            )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                )
            })
        }
        else {
            const firstSegments = pathSegments[0]
            const lastSegment = pathSegments[pathSegments.length - 1]

            return (
                <>
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">{firstSegments}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">{lastSegment}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )              
        }
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {renderBreadcrumbItems()}
            </BreadcrumbList>
        </Breadcrumb>
    )
}


interface FileExplorerProps {
    files: FileCollection;
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
    const [copied, setCopied] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(() => {
        const fileKeys = Object.keys(files);
        return fileKeys.length > 0 ? fileKeys[0] : null;
    })

    const treeData = useMemo(() => {
        return convertFilesToTreeItems(files);
    }, [files])

    const handleFileSelect = useCallback((
        filePath: string) => {
        if (files[filePath]) {
            setSelectedFile(filePath);
        }
    }, [files])

    const handleCopy = useCallback(() => {
        if (selectedFile){
            navigator.clipboard.writeText(files[selectedFile]);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [files, selectedFile])

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={30} minSize={20} className="bg-sidebar flex flex-col h-full">
                <div className="flex-1 overflow-auto">
                    <TreeView
                        data={treeData}
                        value={selectedFile}
                        onSelect={handleFileSelect}
                    />
                </div>
            </ResizablePanel>
            <ResizableHandle className="hover:bg-primary transition-colors" />
            <ResizablePanel defaultSize={70} minSize={50} className="flex flex-col h-full">
                {selectedFile && files[selectedFile] ? (
                    <div className="h-full w-full flex flex-col bg-background">
                        <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
                            <FileBreadcrumb filePath={selectedFile} />
                            <Hint text="Copy to clipboard" side="bottom">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto"
                                    onClick={handleCopy}
                                    disabled={copied}
                                >
                                    {copied ? <CopyCheckIcon /> : <CopyIcon />}
                                </Button>
                            </Hint>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CodeView
                                code={files[selectedFile]}
                                lang={getLanguageFromExtension(selectedFile)}
                                className="h-full"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a file to view it&apos;s content
                    </div>
                )}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};
