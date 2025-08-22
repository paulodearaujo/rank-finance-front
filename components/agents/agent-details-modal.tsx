"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TinyAgent } from "@/lib/agents-loader";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Brain,
  Briefcase,
  Calendar,
  Code2,
  GraduationCap,
  Heart,
  Info,
  MapPin,
  Sparkles,
  Target,
  User,
  Users,
  X,
} from "lucide-react";

interface AgentDetailsModalProps {
  agent: TinyAgent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentDetailsModal({ agent, isOpen, onClose }: AgentDetailsModalProps) {
  if (!agent) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl w-[90vw] h-[85vh] p-0 bg-popover border-border flex flex-col dark"
        showCloseButton={false}
      >
        {/* Hidden Dialog Title for Accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>Detalhes de {agent.persona.name}</DialogTitle>
        </VisuallyHidden.Root>

        {/* Único container com scroll para TODO o conteúdo */}
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {/* Todo o conteúdo dentro deste container rolável */}
          <div className="relative">
            {/* Custom Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 text-muted-foreground hover:text-foreground
                       hover:bg-accent rounded-full h-10 w-10 transition-all duration-200
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-border card-gradient-muted">
              <div className="flex items-start gap-5">
                <div
                  className="w-16 h-16 rounded-xl icon-gradient-primary border border-primary/20
                           flex items-center justify-center shadow-sm
                           text-primary-foreground/80 text-xl font-light shrink-0"
                >
                  {getInitials(agent.persona.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-light text-foreground mb-2 tracking-wide">
                    {agent.persona.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-muted-foreground/50" />
                      <span className="font-light">{agent.persona.occupation.title}</span>
                    </div>
                    {agent.persona.occupation.organization && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{agent.persona.occupation.organization}</span>
                      </div>
                    )}
                    {agent.persona.age && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 text-muted-foreground/50" />
                        <span>{agent.persona.age} anos</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground/50" />
                      <span>{agent.persona.residence}</span>
                    </div>
                  </div>
                  {agent.persona.occupation.description && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                      {agent.persona.occupation.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="flex justify-start gap-1 px-8 bg-transparent border-b border-border rounded-none h-auto p-0 w-full">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                           data-[state=active]:bg-transparent px-4 pb-4 pt-4 text-sm text-muted-foreground
                           data-[state=active]:text-foreground font-light transition-all duration-200
                           hover:text-muted-foreground focus:outline-none focus-visible:outline-none
                           focus:ring-0 focus-visible:ring-0 outline-none ring-0 ring-offset-0"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="personality"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                           data-[state=active]:bg-transparent px-4 pb-4 pt-4 text-sm text-muted-foreground
                           data-[state=active]:text-foreground font-light transition-all duration-200
                           hover:text-muted-foreground focus:outline-none focus-visible:outline-none
                           focus:ring-0 focus-visible:ring-0 outline-none ring-0 ring-offset-0"
                >
                  Personalidade
                </TabsTrigger>
                <TabsTrigger
                  value="routine"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                           data-[state=active]:bg-transparent px-4 pb-4 pt-4 text-sm text-muted-foreground
                           data-[state=active]:text-foreground font-light transition-all duration-200
                           hover:text-muted-foreground focus:outline-none focus-visible:outline-none
                           focus:ring-0 focus-visible:ring-0 outline-none ring-0 ring-offset-0"
                >
                  Rotina
                </TabsTrigger>
                <TabsTrigger
                  value="background"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                           data-[state=active]:bg-transparent px-4 pb-4 pt-4 text-sm text-muted-foreground
                           data-[state=active]:text-foreground font-light transition-all duration-200
                           hover:text-muted-foreground focus:outline-none focus-visible:outline-none
                           focus:ring-0 focus-visible:ring-0 outline-none ring-0 ring-offset-0"
                >
                  Background
                </TabsTrigger>
              </TabsList>

              {/* Content Area */}
              <div className="px-8 py-8">
                <TabsContent value="overview" className="space-y-8 mt-0">
                  {/* Objetivos */}
                  {agent.persona.long_term_goals && agent.persona.long_term_goals.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Objetivos de Longo Prazo
                        </h3>
                      </div>
                      <div className="grid gap-2">
                        {agent.persona.long_term_goals.map((goal) => (
                          <div
                            key={goal}
                            className="p-4 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent transition-all duration-300
                                     hover:shadow-sm"
                          >
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {goal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Interesses */}
                  {agent.persona.preferences?.interests && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Heart className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Interesses
                        </h3>
                      </div>
                      <div className="grid gap-2">
                        {agent.persona.preferences.interests.map((interest) => (
                          <div
                            key={interest}
                            className="p-4 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent transition-all duration-300
                                     hover:shadow-sm"
                          >
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {interest}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Crenças */}
                  {agent.persona.beliefs && agent.persona.beliefs.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Crenças e Valores
                        </h3>
                      </div>
                      <div className="grid gap-2">
                        {agent.persona.beliefs.map((belief) => (
                          <div
                            key={belief}
                            className="p-4 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent transition-all duration-300
                                     hover:shadow-sm"
                          >
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {belief}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="personality" className="space-y-8 mt-0">
                  {/* Traços */}
                  {agent.persona.personality?.traits && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Traços de Personalidade
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {agent.persona.personality.traits.map((trait) => (
                          <div
                            key={trait}
                            className="p-3 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent
                                     text-foreground text-sm text-center font-light tracking-wide
                                     transition-all duration-300 hover:shadow-sm"
                          >
                            {trait}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Big Five */}
                  {agent.persona.personality?.big_five && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Modelo Big Five
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {Object.entries(agent.persona.personality.big_five).map(([key, value]) => (
                          <div
                            key={key}
                            className="p-4 rounded-lg card-gradient-subtle border border-border
                                       hover:border-accent transition-all duration-300 hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-sm text-foreground font-normal mb-2">
                                  {key === "openness"
                                    ? "Abertura"
                                    : key === "conscientiousness"
                                      ? "Conscienciosidade"
                                      : key === "extraversion"
                                        ? "Extroversão"
                                        : key === "agreeableness"
                                          ? "Amabilidade"
                                          : key === "neuroticism"
                                            ? "Neuroticismo"
                                            : key.replace("_", " ")}
                                </h4>
                                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                                  {value}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Estilo de Comunicação */}
                  {agent.persona.style && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Estilo de Comunicação
                        </h3>
                      </div>
                      <div
                        className="p-5 rounded-xl card-gradient-subtle border border-border
                                 hover:border-accent transition-all duration-300 hover:shadow-sm"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {agent.persona.style}
                        </p>
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="routine" className="space-y-6 mt-0">
                  {agent.persona.behaviors?.routines && (
                    <div className="grid gap-6">
                      {Object.entries(agent.persona.behaviors.routines).map(
                        ([period, activities]) => (
                          <section
                            key={period}
                            className="card-gradient-subtle rounded-xl border border-border p-6
                                     hover:border-accent transition-all duration-300 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Calendar className="h-4 w-4 text-muted-foreground/50" />
                              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {period === "morning"
                                  ? "Manhã"
                                  : period === "workday"
                                    ? "Dia de Trabalho"
                                    : period === "evening"
                                      ? "Noite"
                                      : period === "weekend"
                                        ? "Fim de Semana"
                                        : period}
                              </h3>
                            </div>
                            <div className="space-y-2">
                              {(activities as string[]).map((activity) => (
                                <div
                                  key={activity}
                                  className="text-sm text-muted-foreground leading-relaxed"
                                >
                                  {activity}
                                </div>
                              ))}
                            </div>
                          </section>
                        ),
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="background" className="space-y-8 mt-0">
                  {/* Educação */}
                  {agent.persona.education && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Educação
                        </h3>
                      </div>
                      <div
                        className="p-5 rounded-xl card-gradient-subtle border border-border
                                 hover:border-accent transition-all duration-300 hover:shadow-sm"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {agent.persona.education}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Habilidades */}
                  {agent.persona.skills && agent.persona.skills.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Code2 className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Habilidades
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {agent.persona.skills.map((skill) => (
                          <div
                            key={skill}
                            className="p-3 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent
                                     text-foreground text-sm font-light tracking-wide
                                     transition-all duration-300 hover:shadow-sm"
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Relacionamentos */}
                  {agent.persona.relationships && agent.persona.relationships.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Relacionamentos
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {agent.persona.relationships.map((rel) => (
                          <div
                            key={rel.name}
                            className="p-4 rounded-xl card-gradient-subtle
                                     border border-border hover:border-accent transition-all duration-300 hover:shadow-sm"
                          >
                            <p className="text-sm text-foreground font-normal mb-1.5">{rel.name}</p>
                            <p className="text-sm text-muted-foreground font-light">
                              {rel.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Outros Fatos */}
                  {agent.persona.other_facts && agent.persona.other_facts.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="h-4 w-4 text-muted-foreground/50" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Curiosidades
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {agent.persona.other_facts.map((fact) => (
                          <div
                            key={fact}
                            className="p-4 rounded-lg card-gradient-subtle
                                     border border-border hover:border-accent transition-all duration-300
                                     hover:shadow-sm"
                          >
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {fact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
