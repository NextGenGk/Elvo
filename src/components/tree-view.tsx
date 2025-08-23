import { TreeItem } from "@/types";
import { ChevronRightIcon, FolderIcon, FileIcon } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarProvider,
    SidebarRail,
} from "@/components/ui/sidebar"

import { 
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"


interface TreeViewProps {
    data: TreeItem[];
    value?: string | null;
    onSelect: (value: string) => void;
};

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
    return (
        <SidebarProvider>
            <Sidebar collapsible="none" className="w-full">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {data.map((item, index) => (
                                    <Tree
                                        key={index}
                                        item={item}
                                        selectedValue={value}
                                        onSelect={onSelect}
                                        parentPath=""
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
            </Sidebar>
        </SidebarProvider>
    );
};

interface TreeProps {
    item: TreeItem;
    selectedValue?: string | null;
    onSelect?: (value: string) => void;
    parentPath?: string;
}

const Tree = ({ item, selectedValue, onSelect, parentPath = '', depth = 0 }: TreeProps & { depth?: number }) => {
    // If item is a string, it's a file
    if (typeof item === 'string') {
        const name = item;
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        const isSelected = selectedValue === currentPath;

        return (
            <SidebarMenuItem
                data-active={isSelected}
                className={`data-[active=true]:bg-transparent cursor-pointer pl-${Math.min(depth * 4, 16)}`}
                style={{ paddingLeft: `${Math.min(depth * 16, 64)}px` }}
                onClick={() => onSelect?.(currentPath)}
            >
                <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">
                        {name}
                    </span>
                </div>
            </SidebarMenuItem>
        )
    }

    // If item is an array, first element is name, rest are children
    const [name, ...childItems] = item;
    const currentPath = parentPath ? `${parentPath}/${name}` : name;

    return (
        <SidebarMenuItem className="pl-0">
            <Collapsible
                className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
                defaultOpen
            >
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full hover:bg-transparent">
                        <div 
                            className="flex items-center gap-2 w-full"
                            style={{ paddingLeft: `${Math.min(depth * 16, 64)}px` }}
                        >
                            <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 transition-transform text-muted-foreground" />
                            <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                            <span className="truncate text-sm font-medium">
                                {name}
                            </span>
                        </div>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                    <SidebarMenuSub className="space-y-0.5">
                        {childItems.map((subItem, index) => (
                            <Tree
                                key={index}
                                item={subItem}
                                selectedValue={selectedValue}
                                onSelect={onSelect}
                                parentPath={currentPath}
                                depth={depth + 1}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
};