import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <main className="min-h-screen w-full bg-[#020617] relative">
            {/* Purple Radial Glow Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `radial-gradient(circle 500px at 50% 100px, rgba(139,92,246,0.4), transparent)`,
                }}
            />
            <div className="relative z-10">
                <Navbar />
                <div className="flex-1 flex flex-col px-4 pb-4">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default Layout;