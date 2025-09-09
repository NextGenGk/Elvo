"use client";

import { useCustomTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";

interface Props {
    showName?: boolean;
    isScrolled?: boolean;
}

export const UserControl = ({ showName = true, isScrolled = false }: Props) => {
    const currentTheme = useCustomTheme();

    return (
        <div className="flex items-center gap-2">
            <div className={isScrolled ? "text-foreground" : "text-white"}>
                <UserButton
                    showName={showName}
                    appearance={{
                        elements: {
                            userButtonBox: "flex items-center gap-2",
                            userButtonAvatarBox: "rounded-md! size-8!",
                            userButtonTrigger: `rounded-md! border border-transparent hover:border-border transition-colors ${isScrolled ? 'hover:opacity-80' : 'hover:opacity-80'}`,
                            userButtonOuterIdentifier: `text-sm font-medium ${isScrolled ? 'text-foreground' : 'text-white'} hover:opacity-80`,
                            userButtonPopoverActionButtonText: 'text-foreground',
                            userButtonPopoverActionButton: 'hover:bg-muted',
                            userPreviewMainIdentifier: 'text-foreground',
                            userButtonPopoverCard: 'bg-background',
                        },
                        baseTheme: currentTheme === "dark" ? dark : undefined,
                        variables: {
                            colorText: currentTheme === "dark" ? '#ffffff' : 'currentColor',
                            colorTextSecondary: currentTheme === "dark" ? '#a1a1aa' : 'currentColor',
                            colorTextOnPrimaryBackground: currentTheme === "dark" ? '#ffffff' : 'currentColor',
                        },
                    }}
                />
            </div>
        </div>
    )
}
