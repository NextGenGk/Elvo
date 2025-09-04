"use client";

import { SignUp } from '@clerk/nextjs'
import { dark } from "@clerk/themes";
import { useCustomTheme } from "@/hooks/use-current-theme";

const Page = () => {
    const currentTheme = useCustomTheme();

    return (
        <div className='flex flex-col max-w-3xl mx-auto w-full min-h-[calc(100vh-4rem)]'>
            <section className='flex-1 flex flex-col justify-start pt-20 space-y-6 pb-12'>
                <div className='flex flex-col items-center w-full max-w-md mx-auto space-y-6'>
                    <div className='w-full text-center space-y-2'>
                        <h1 className='text-3xl font-bold text-foreground'>Create your account</h1>
                        <p className='text-muted-foreground'>Get started with your free account today</p>
                    </div>
                    <div className='w-full border-t border-white/10' />
                    <SignUp
                        appearance={{
                            baseTheme: currentTheme === "dark" ? dark : undefined,
                            elements: {
                                cardBox: "border! shadow-none! rounded-lg!"
                            }
                        }} />
                </div>
            </section>
        </div>
    )
}

export default Page;