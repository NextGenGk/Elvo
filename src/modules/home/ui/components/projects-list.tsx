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
    <div className="w-full bg-card rounded-xl p-6 border flex flex-col gap-y-6">
      <h2 className="text-2xl font-semibold">{user?.fullName}&apos;s Workspace</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No projects found</p>
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
                <div className="h-full p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors group-hover:shadow-sm">
                  <div className="flex items-center gap-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Image
                        src="/logo.svg"
                        alt="Elvo"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(project.updatedAt, {
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
