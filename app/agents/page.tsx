"use client";

import { AgentDetailsModal } from "@/components/agents/agent-details-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadAgents, type TinyAgent } from "@/lib/agents-loader";
import { ArrowLeft, MapPin, Search, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<TinyAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<TinyAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar agentes reais
  useEffect(() => {
    loadAgents().then((data) => {
      setAgents(data);
      setLoading(false);
    });
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      agent.persona.name.toLowerCase().includes(searchLower) ||
      agent.persona.occupation.title.toLowerCase().includes(searchLower)
    );
  });

  const openAgentDetails = (agent: TinyAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Gerar ID seguro a partir do nome
  const getAgentId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  return (
    <div id="agents-page-container" className="min-h-screen bg-background text-foreground dark">
      {/* Header Sticky Ultra Minimalista */}
      <header
        id="agents-header"
        className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-xl"
      >
        <div className="px-8 py-5">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto">
            <nav id="agents-nav" className="flex items-center gap-8">
              <Link href="/">
                <Button
                  id="back-to-chat-button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent h-9 w-9"
                  aria-label="Voltar para o chat"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>

              <hgroup id="page-title-group">
                <h1 id="page-title" className="text-lg font-normal text-foreground tracking-tight">
                  Agentes TinyTroupe
                </h1>
                <p id="page-subtitle" className="text-xs text-muted-foreground mt-0.5">
                  {agents.length} personas brasileiras
                </p>
              </hgroup>
            </nav>

            {/* Search Refinada */}
            <search id="agents-search-section" className="relative w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="agents-search-input"
                type="search"
                placeholder="Buscar agente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground
                         text-sm focus:bg-muted/50 focus:border-accent transition-all"
                aria-label="Buscar agentes"
              />
            </search>
          </div>
        </div>
      </header>

      {/* Main Content com Espaçamento Perfeito */}
      <main id="agents-main-content" className="px-8 py-10">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div id="loading-state" className="flex items-center justify-center h-96">
              <p className="text-muted-foreground text-sm">Carregando agentes...</p>
            </div>
          ) : (
            <section id="agents-grid-section" aria-label="Lista de agentes">
              <div
                id="agents-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {filteredAgents.map((agent) => {
                  const agentId = getAgentId(agent.persona.name);
                  return (
                    <Card
                      key={agent.persona.name}
                      id={`agent-card-${agentId}`}
                      onClick={() => openAgentDetails(agent)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openAgentDetails(agent);
                        }
                      }}
                      className="card-gradient-subtle border-border hover:border-accent
                               transition-all duration-300 cursor-pointer p-6 group h-full
                               hover:shadow-sm focus:outline-none focus:ring-2
                               focus:ring-ring animate-in fade-in-0 slide-in-from-bottom-2"
                    >
                      {/* Header com Avatar e Nome */}
                      <header className="flex items-start gap-4 mb-4">
                        <div
                          id={`agent-avatar-${agentId}`}
                          className="w-12 h-12 rounded-full icon-gradient-subtle border border-muted/20
                                   flex items-center justify-center text-muted-foreground text-base
                                   font-medium group-hover:border-primary/30 transition-all shrink-0"
                        >
                          {getInitials(agent.persona.name)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h2
                            id={`agent-name-${agentId}`}
                            className="text-foreground text-base font-medium leading-tight mb-1"
                          >
                            {agent.persona.name}
                          </h2>
                          <p
                            id={`agent-role-${agentId}`}
                            className="text-muted-foreground text-sm leading-tight"
                          >
                            {agent.persona.occupation.title}
                          </p>
                        </div>
                      </header>

                      {/* Informações com Ícones */}
                      <section id={`agent-info-${agentId}`} className="space-y-2.5 mb-4">
                        <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span id={`agent-location-${agentId}`} className="truncate">
                            {agent.persona.residence}
                          </span>
                        </div>
                        {agent.persona.age && (
                          <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
                            <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span id={`agent-age-${agentId}`}>{agent.persona.age} anos</span>
                          </div>
                        )}
                      </section>

                      {/* Descrição com Melhor Contraste */}
                      <p
                        id={`agent-description-${agentId}`}
                        className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed"
                      >
                        {agent.persona.occupation.description}
                      </p>

                      {/* Tags Refinadas */}
                      {agent.persona.personality?.traits && (
                        <footer
                          id={`agent-tags-${agentId}`}
                          className="flex gap-2 flex-wrap pt-4 border-t border-border"
                        >
                          {agent.persona.personality.traits.slice(0, 2).map((trait) => (
                            <span
                              key={trait}
                              className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground
                                       border border-border"
                            >
                              {trait}
                            </span>
                          ))}
                          {agent.persona.personality.traits.length > 2 && (
                            <span className="text-xs px-2.5 py-1 text-muted-foreground/50">
                              +{agent.persona.personality.traits.length - 2}
                            </span>
                          )}
                        </footer>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modal de Detalhes Centralizado */}
      <AgentDetailsModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgent(null);
        }}
      />
    </div>
  );
}
