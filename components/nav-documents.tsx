"use client";

import { type Icon, IconDots, IconFolder, IconShare3 } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: Icon;
  }[];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documentos</SidebarGroupLabel>
      <SidebarMenu>
        <TooltipProvider>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Em breve</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover className="data-[state=open]:bg-accent rounded-sm">
                    <IconDots />
                    <span className="sr-only">Mais</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <IconFolder />
                    <span>Abrir</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 />
                    <span>Compartilhar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <IconDots className="text-sidebar-foreground/70" />
                  <span>Mais</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Em breve</p>
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </TooltipProvider>
      </SidebarMenu>
    </SidebarGroup>
  );
}
