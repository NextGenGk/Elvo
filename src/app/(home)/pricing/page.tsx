"use client";

import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { useCustomTheme } from "@/hooks/use-current-theme";

const Page = () => {
    const currentTheme = useCustomTheme();

    return (
        <div className="flex flex-col max-w-3xl mx-auto w-full">
            <section className="space-y-6 pt-[16vh] 2xl:pt-48">
                <div className="flex flex-col items-center">
                    <Image 
                        src="/logo.svg"
                        alt="Elvo"
                        width={50}
                        height={50}
                        className="hidden md:block"
                    />
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
                <p className="text-muted-foreground text-center text-sm md:text-base">Choose a plan that works for you</p>
                <div className={cn(
                    "[&_.cl-pricingTableCard]:border [&_.cl-pricingTableCard]:border-border [&_.cl-pricingTableCard]:bg-card [&_.cl-pricingTableCard]:text-card-foreground",
                    "[&_.cl-pricingTableHeader]:border-b [&_.cl-pricingTableHeader]:border-border",
                    "[&_.cl-pricingTableRow]:border-b [&_.cl-pricingTableRow]:border-border last:[&_.cl-pricingTableRow]:border-b-0",
                    "[&_.cl-pricingTableFooter]:border-t [&_.cl-pricingTableFooter]:border-border"
                )}>
                    <PricingTable 
                        appearance={{
                            baseTheme: currentTheme === "dark" ? dark : undefined,
                            elements: {
                                pricingTableCard: "shadow-none rounded-lg",
                                pricingTableHeader: "p-6",
                                pricingTableRow: "py-3 px-6",
                                pricingTableFooter: "p-6"
                            }
                        }}
                    />
                </div>
            </section>
        </div>
    )
}

export default Page;
