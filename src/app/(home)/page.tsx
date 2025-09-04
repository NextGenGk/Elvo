import Image from "next/image";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/projects-list";

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-3 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center text-white">
          <Image
            src="/logo.svg"
            alt="Elvo"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-2xl text-white md:text-5xl font-bold text-center ">Build something with Elvo</h1>
        <p className="text-lg text-white md:text-xl text-muted-foreground text-center">Create apps and websites by chatting with AI</p>
        <div className="max-w-3xl mx-auto w-full pt-4">
          <ProjectForm />
        </div>
      </section>
      <ProjectList />
    </div>
  )
}

export default Page;