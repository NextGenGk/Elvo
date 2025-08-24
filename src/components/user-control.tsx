"use client";

import { useCustomTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";

interface Props {
    showName?: boolean;
}

export const UserControl = ({ showName = true }: Props) => {
    const currentTheme = useCustomTheme();

    return (
        <div className="flex items-center gap-2">
            <UserButton
                showName={showName}
                appearance={{
                    elements: {
                        userButtonBox: "flex items-center gap-2",
                        userButtonAvatarBox: "rounded-md! size-8!",
                        userButtonTrigger: "rounded-md!",
                        userButtonOuterIdentifier: cn(
                            "text-sm font-medium",
                            currentTheme === 'dark' ? 'text-white' : 'text-foreground'
                        ),
                    },
                    baseTheme: currentTheme === "dark" ? dark : undefined,
                    variables: {
                        colorText: currentTheme === 'dark' ? '#ffffff' : '#000000',
                    },
                }}
            />
        </div>
    )
}