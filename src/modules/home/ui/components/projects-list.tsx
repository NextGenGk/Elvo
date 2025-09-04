"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export const ProjectList = () => {
  const trpc = useTRPC();
  const { user } = useUser();
  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());

  if (!user) {
    return null;
  }

  return (
    <div className="w-full bg-background dark:bg-white rounded-xl p-6 border flex flex-col gap-y-6">
      <h2 className="text-2xl font-semibold text-foreground dark:text-black">{user?.fullName}&apos;s Workspace</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground dark:text-gray-600">No projects found</p>
          </div>
        ) : (
          projects?.map((project) => (
            <div 
              key={project.id}
              className="group relative"
            >
              <Link 
                href={`/projects/${project.id}`}
                className="block h-full"
              >
                <div className="h-full p-4 border rounded-lg bg-white dark:bg-gray-50 hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors group-hover:shadow-sm">
                  <div className="flex items-center gap-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-card dark:bg-gray-100">
                      <Image
                        src="/logo.svg"
                        alt="Elvo"
                        width={20}
                        height={20}
                        className="object-contain"
                        style={{ filter: 'invert(50%) sepia(95%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate text-foreground dark:text-gray-900">{project.name}</h3>
                      <p className="text-xs text-muted-foreground dark:text-gray-600">
                        {formatDistanceToNow(new Date(project.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
