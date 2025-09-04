"use client"

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form"
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constants";
import { useClerk } from "@clerk/nextjs";

const formSchema = z.object({
    value: z.string()
        .min(1, { message: 'Value is required' })
        .max(10000, { message: 'Value is too long' }),
})

export const ProjectForm = () => {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const clerk = useClerk();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: '',
        },
    })

    const createProject = useMutation(trpc.projects.create.mutationOptions({
        onSuccess: (data) => {
            queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
            queryClient.invalidateQueries(trpc.usage.status.queryOptions());
            router.push(`/projects/${data.id}`);
        },
        onError: (error) => {
            toast.error(error.message);

            if (error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }

            if (error.data?.code === "TOO_MANY_REQUESTS") {
                router.push("/pricing");
            }
        },
    }))

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        await createProject.mutateAsync({
            value: values.value,
        })
    };

    const onSelect = (value: string) => {
        form.setValue('value', value, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
        });
    }

    const [isFocused, setIsFocused] = useState(false)
    const isPending = createProject.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;

    return (
        <Form {...form}>
            <section className="space-y-6">
                <form onSubmit={form.handleSubmit(onSubmit)}
                    className={cn(
                        "relative p-4 pt-1 rounded-xl transition-all duration-300",
                        "border border-gray-200 bg-white text-gray-900",
                        "hover:border-gray-600 hover:shadow-[0_0_60px_15px_rgba(139,92,246,0.1)]",
                        "focus-within:ring-2 focus-within:ring-gray-400/20",
                        isFocused && "ring-2 ring-gray-400/20"
                    )}>
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <TextareaAutosize
                                {...field}
                                disabled={isPending}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                minRows={2}
                                maxRows={8}
                                className={cn(
                                    "w-full resize-none border-none bg-transparent pt-4 outline-none text-gray-900",
                                    "placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-0"
                                )}
                                placeholder="What would you like to build?"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        form.handleSubmit(onSubmit)(e);
                                    }
                                }}
                            />
                        )}
                    />
                    <div className="flex items-end justify-between gap-x-2 pt-2">
                        <div className="text-[10px] font-mono text-gray-600 dark:text-gray-600">
                            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-gray-300 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600 dark:border-gray-400 dark:bg-gray-100 dark:text-gray-600">
                                <span>&#8984;</span>Enter
                            </kbd>
                            &nbsp;to submit
                        </div>
                        <Button
                            type="submit"
                            disabled={isButtonDisabled}
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full transition-colors",
                                "bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white dark:hover:bg-black/90",
                                isButtonDisabled && "bg-gray-400 text-gray-600 hover:bg-gray-400 dark:bg-gray-400 dark:text-gray-600"
                            )}
                        >
                            {isPending ? (
                                <Loader2Icon className="h-4 w-4 animate-spin text-white dark:text-white" />
                            ) : (
                                <ArrowUpIcon className="h-4 w-4 text-white dark:text-white" />
                            )}
                        </Button>
                    </div>
                </form>
                <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
                    {PROJECT_TEMPLATES.map((template) => (
                        <Button
                            key={template.title}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-sidebar"
                            onClick={() => onSelect(template.prompt)}
                        >
                            {template.title}
                        </Button>
                    ))}
                </div>
            </section>
        </Form>
    )
}