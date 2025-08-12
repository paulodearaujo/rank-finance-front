"use client";

import { type Icon, IconCirclePlusFilled, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Novo"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Novo</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconPencil />
              <span className="sr-only">Editar</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <TooltipProvider>
            {items.map((item) => {
              // Adiciona tooltip "Em breve" para Projetos
              const isProjects = item.title === "Projetos";
              const tooltipText = isProjects ? "Em breve" : item.title;

              return (
                <SidebarMenuItem key={item.title}>
                  {isProjects ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </TooltipProvider>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
