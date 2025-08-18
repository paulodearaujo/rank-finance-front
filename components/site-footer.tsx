"use client";

import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";
import * as React from "react";

const INLAB_MEMBERS: readonly string[] = [
	"Carlos Moura",
	"Gabriela Fiorentino",
	"Paulo Alexandre",
	"Pedro Barreto",
	"Viviane Alvarez",
]
	.slice()
	.sort((a, b) => a.localeCompare(b));

export function SiteFooter(): React.ReactElement {
	const members = React.useMemo(() => INLAB_MEMBERS, []);

	return (
		<footer className="border-t py-8 text-sm sm:text-[0.9375rem] text-muted-foreground">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-center">
					<p className="text-center leading-relaxed text-balance">
						This is a{" "}
						<span className="font-medium text-foreground">CloudWalk</span>{" "}
						project · built by{" "}
						<HoverCard>
							<HoverCardTrigger asChild>
								<Button
									variant="link"
									className="px-0 py-0 h-auto min-h-0 align-baseline leading-[inherit] font-normal text-foreground hover:text-foreground/90"
									aria-label="Show InLab team members"
								>
									@InLab
								</Button>
							</HoverCardTrigger>
							<HoverCardContent align="center" className="w-80">
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Image
											src="/postcss.svg"
											alt="InLab Logo"
											width={20}
											height={20}
										/>
										<h4 className="text-sm font-semibold">InLab Mafia</h4>
									</div>
									<ul className="grid grid-cols-1 gap-1 text-sm">
										{members.map((name) => (
											<li key={name} className="truncate" title={name}>
												{name}
											</li>
										))}
									</ul>
								</div>
							</HoverCardContent>
						</HoverCard>
					</p>
				</div>
			</div>
		</footer>
	);
}

export default SiteFooter;
