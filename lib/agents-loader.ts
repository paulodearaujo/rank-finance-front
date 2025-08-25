// Loader para os agentes TinyTroupe
export interface TinyPersona {
  name: string;
  age: number;
  nationality?: string;
  country_of_residence?: string | null;
  occupation: {
    title: string;
    organization?: string;
    description: string;
  };
  gender: string;
  residence: string;
  education?: string;
  long_term_goals?: string[];
  style?: string;
  personality?: {
    traits: string[];
    big_five?: {
      openness: string;
      conscientiousness: string;
      extraversion: string;
      agreeableness: string;
      neuroticism: string;
    };
  };
  preferences?: {
    interests?: string[];
    likes?: string[];
    dislikes?: string[];
  };
  beliefs?: string[];
  skills?: string[];
  behaviors?: {
    general?: string[];
    routines?: {
      morning?: string[];
      workday?: string[];
      evening?: string[];
      weekend?: string[];
    };
  };
  health?: string;
  relationships?: Array<{
    name: string;
    description: string;
  }>;
  other_facts?: string[];
}

export interface TinyAgent {
  type: string;
  persona: TinyPersona;
  current_episode_event_count: number;
  mental_faculties: unknown[];
}

// Função para carregar todos os agentes
export async function loadAgents(): Promise<TinyAgent[]> {
  try {
    // Lista de agentes conhecidos
    const agentFiles = [
      "Andr_Luiz_Santana_Ramos",
      "Carlos_Eduardo_Pereira",
      "Fernanda_Oliveira_Costa",
      "Guilherme_Nogueira_Campos",
      "Luciana_Ribeiro_Martins",
      "Marcelo_Andrade_Gomes",
      "Mariana_Ferreira_Alves",
      "Rafael_Souza_Lima",
      "Renato_Carvalho_Silva",
      "Tatiana_Mendes_Rocha",
    ];

    const agents: TinyAgent[] = [];

    for (const fileName of agentFiles) {
      try {
        const response = await fetch(`/agents/${fileName}.agent.json`);
        if (response.ok) {
          const agent = await response.json();
          agents.push(agent);
        }
      } catch (error) {
        console.error(`Erro ao carregar agente ${fileName}:`, error);
      }
    }

    return agents;
  } catch (error) {
    console.error("Erro ao carregar agentes:", error);
    return [];
  }
}

// Extrair iniciais do nome
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Obter cor baseada no index
export function getAgentColor(index: number): string {
  const colors = [
    "text-purple-400",
    "text-blue-400",
    "text-emerald-400",
    "text-amber-400",
    "text-rose-400",
    "text-cyan-400",
    "text-indigo-400",
    "text-pink-400",
    "text-teal-400",
    "text-orange-400",
  ];
  return colors[index % colors.length] || "text-white";
}
