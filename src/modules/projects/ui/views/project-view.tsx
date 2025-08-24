"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Fragment } from "@/generated/prisma";
import { MessagesContainer } from "@/modules/projects/ui/components/messages-container";
import { Suspense, useState } from "react";
import { ProjectHeader } from "@/modules/projects/ui/components/project-header";
import { FragmentWeb } from "@/modules/projects/ui/components/fragment-web";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<div>Loading Project...</div>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<div>Loading Messages...</div>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <Button asChild size="sm" variant="tertiary">
                  <Link href="/pricing">
                    <CrownIcon /> Upgrade
                  </Link>
                </Button>
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {activeFragment?.files ? (
                <FileExplorer
                  files={activeFragment.files as { [path: string]: string }}
                  fragmentId={activeFragment.id}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CodeIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No Code Available
                    </p>
                    <p className="text-sm">
                      {activeFragment 
                        ? "This message doesn't contain any code files" 
                        : "Select a message with code to view the files here"
                      }
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <details className="mt-4 text-xs">
                        <summary>Debug Info</summary>
                        <pre className="text-left mt-2 p-2 bg-gray-100 rounded">
                          {JSON.stringify({ 
                            hasActiveFragment: !!activeFragment,
                            fragmentId: activeFragment?.id,
                            hasFiles: !!activeFragment?.files,
                            filesType: typeof activeFragment?.files,
                            filesKeys: activeFragment?.files ? Object.keys(activeFragment.files) : null
                          }, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
