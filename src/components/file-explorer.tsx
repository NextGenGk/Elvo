"use client";

import { Fragment, useCallback, useMemo, useState, useEffect } from "react";
import { CopyIcon, CopyCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

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
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from "./ui/breadcrumb";
import { useTRPC } from "@/trpc/client";

type FileCollection = { [path: string]: string };

function getLanguageFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    css: "css",
    scss: "css",
    sass: "css",
    html: "html",
    htm: "html",
    xml: "xml",
    py: "python",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    md: "markdown",
    markdown: "markdown",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };

  return languageMap[extension || ""] || "text";
}

interface FileBreadcrumbProps {
  filePath: string;
}

const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
  const pathSegments = filePath.split("/");
  const maxSegments = 4;

  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;

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
        );
      });
    } else {
      const firstSegments = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];

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
            <BreadcrumbPage className="font-medium">
              {lastSegment}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};

interface FileExplorerProps {
  files: FileCollection;
  fragmentId: string;
}

export const FileExplorer = ({
  files: initialFiles,
  fragmentId,
}: FileExplorerProps) => {
  const trpc = useTRPC();
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(initialFiles);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const treeData = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileContentChange = useCallback(
    (filePath: string, newContent: string) => {
      setFiles((prev) => ({
        ...prev,
        [filePath]: newContent,
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  const updateFragmentFilesMutation = useMutation(
    trpc.projects.updateFragmentFiles.mutationOptions()
  );

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      await updateFragmentFilesMutation.mutateAsync({
        fragmentId,
        files,
      });
      toast.success("File saved successfully");
      setIsEditing(false); // Exit edit mode after successful save
      setHasUnsavedChanges(false); // Clear unsaved changes flag
    } catch (error) {
      console.error("Error saving file:", error);
      toast.error("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, files, fragmentId, updateFragmentFilesMutation]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (files[filePath]) {
        setSelectedFile(filePath);
      }
    },
    [files]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [files, selectedFile]);

  // Listen for Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleSaveEvent = () => {
      if (isEditing) {
        handleSave();
      }
    };

    window.addEventListener("save-file", handleSaveEvent);
    return () => window.removeEventListener("save-file", handleSaveEvent);
  }, [isEditing, handleSave]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        className="bg-sidebar flex flex-col h-full"
      >
        <div className="flex-1 overflow-auto">
          <TreeView
            data={treeData}
            value={selectedFile}
            onSelect={handleFileSelect}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel
        defaultSize={70}
        minSize={50}
        className="flex flex-col h-full"
      >
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col bg-background">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              <div className="flex items-center gap-2">
                <FileBreadcrumb filePath={selectedFile} />
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-500 font-medium">
                    • Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Hint
                  text={isEditing ? "Exit edit mode" : "Edit file"}
                  side="bottom"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      isEditing
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </Button>
                </Hint>
                {isEditing && (
                  <Hint
                    text={
                      hasUnsavedChanges
                        ? "Save changes (Ctrl+S)"
                        : "Save changes"
                    }
                    side="bottom"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${
                        hasUnsavedChanges
                          ? "text-orange-500 hover:text-orange-600"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                      )}
                    </Button>
                  </Hint>
                )}
                <Hint text="Copy to clipboard" side="bottom">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <CopyCheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </Hint>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
                className="h-full"
                onChange={(newContent) =>
                  selectedFile &&
                  handleFileContentChange(selectedFile, newContent)
                }
                isEditing={isEditing}
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
