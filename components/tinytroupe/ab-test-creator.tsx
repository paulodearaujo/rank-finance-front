"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// Zod schemas for validation
const messageSchema = z.object({
  hook: z
    .string()
    .trim()
    .min(3, "Hook deve ter no mínimo 3 caracteres")
    .max(100, "Hook deve ter no máximo 100 caracteres"),
  body: z
    .string()
    .trim()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(500, "Mensagem deve ter no máximo 500 caracteres"),
});

const abTestSchema = z.object({
  context: z
    .string()
    .trim()
    .min(20, "Contexto deve ter no mínimo 20 caracteres")
    .max(1000, "Contexto deve ter no máximo 1000 caracteres"),
  messages: z
    .record(z.string(), messageSchema)
    .refine((messages) => "control" in messages, "Mensagem de controle é obrigatória")
    .refine((messages) => Object.keys(messages).length >= 2, "Deve ter pelo menos 2 variantes"),
});

type ABTestFormData = z.infer<typeof abTestSchema>;

interface ABTestMessage {
  hook: string;
  body: string;
}

interface ABTestScenario {
  id?: string;
  name?: string;
  context: string;
  messages: {
    control: ABTestMessage;
    [key: string]: ABTestMessage;
  };
}

interface ABTestCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scenario: ABTestScenario) => void;
}

export function ABTestCreator({ isOpen, onClose, onSubmit }: ABTestCreatorProps) {
  const contextRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize react-hook-form with Zod resolver
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    reset,
    trigger,
  } = useForm<ABTestFormData>({
    resolver: zodResolver(abTestSchema),
    defaultValues: {
      context: "",
      messages: {
        control: { hook: "", body: "" },
        variant_a: { hook: "", body: "" },
      },
    },
    mode: "onChange",
  });

  // Watch messages to handle dynamic variants
  const watchedMessages = watch("messages");
  const variantCount = Object.keys(watchedMessages || {}).filter((k) =>
    k.startsWith("variant_"),
  ).length;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        context: "",
        messages: {
          control: { hook: "", body: "" },
          variant_a: { hook: "", body: "" },
        },
      });
      // Focus on context field after modal opens
      setTimeout(() => contextRef.current?.focus(), 100);
    }
  }, [isOpen, reset]);

  // Auto-resize textareas
  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  // Add new variant
  const addVariant = () => {
    const currentMessages = getValues("messages") || {};
    const existingVariants = Object.keys(currentMessages).filter((k) => k.startsWith("variant_"));
    const nextLetter = String.fromCharCode(97 + existingVariants.length); // a, b, c, etc.
    const newVariantKey = `variant_${nextLetter}`;

    setValue("messages", {
      ...currentMessages,
      [newVariantKey]: { hook: "", body: "" },
    });

    // Scroll to bottom after adding
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
  };

  // Remove variant
  const removeVariant = (variant: string) => {
    if (variant === "control" || variant === "variant_a") return; // Can't remove control or first variant

    const currentMessages = getValues("messages") || {};
    const newMessages = { ...currentMessages };
    delete newMessages[variant];
    setValue("messages", newMessages);
  };

  // Handle form submission
  const onFormSubmit = async (data: ABTestFormData) => {
    const scenario: ABTestScenario = {
      id: `test_${Date.now()}`,
      name: `Teste A/B - ${new Date().toLocaleDateString("pt-BR")}`,
      context: data.context.trim(),
      messages: data.messages as ABTestScenario["messages"],
    };

    onSubmit(scenario);
    onClose();
  };

  // Get variant display name
  const getVariantName = (key: string) => {
    if (key === "control") return "Controle";
    const parts = key.split("_");
    return `Variante ${parts[1]?.toUpperCase() || ""}`;
  };

  // Get field error message
  const getFieldError = (variant: string, field: "hook" | "body"): string | undefined => {
    return errors.messages?.[variant]?.[field]?.message;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-6xl w-[94vw] h-[92vh] p-0 bg-card border-border flex flex-col overflow-hidden dark"
          showCloseButton={false}
        >
          {/* Header - Fixed */}
          <DialogHeader className="px-8 pt-5 pb-4 border-b border-border bg-gradient-to-b from-card via-card to-background/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  {/* Progress indicator */}
                  {(watch("context") ||
                    Object.values(watchedMessages || {}).some((m) => m.hook || m.body)) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-primary to-primary/60 rounded-full animate-pulse shadow-sm" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                    Criar teste A/B
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure as mensagens para testar com os agentes
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-accent transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-hidden relative">
              <div
                className="absolute inset-0 overflow-y-auto overflow-x-hidden px-8 py-6
                          scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10
                          hover:scrollbar-thumb-muted-foreground/50
                          dark:scrollbar-thumb-muted-foreground/20 dark:scrollbar-track-muted/20
                          dark:hover:scrollbar-thumb-muted-foreground/40"
              >
                <div ref={scrollRef} className="space-y-8 pb-20">
                  {/* Context Section */}
                  <Card className="p-6 bg-gradient-to-br from-background via-background to-muted/30 border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Label htmlFor="context" className="text-sm font-bold text-foreground">
                            Contexto do teste
                          </Label>
                          {errors.context && (
                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
                              {errors.context.message}
                            </Badge>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs dark">
                            <p className="text-xs">
                              O contexto define como os agentes devem interpretar as mensagens. Seja
                              específico sobre a situação do usuário (mínimo 20, máximo 1000
                              caracteres).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Controller
                        name="context"
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            id="context"
                            ref={contextRef}
                            onChange={(e) => {
                              field.onChange(e);
                              autoResize(e.target);
                              trigger("context");
                            }}
                            placeholder="Ex: Você é um pequeno empreendedor que recentemente criou um cartão virtual InfinitePay mas ainda não fez a primeira compra..."
                            className={cn(
                              "min-h-[100px] resize-none bg-background border-border",
                              "placeholder:text-muted-foreground focus:border-primary focus:bg-card",
                              "transition-all duration-200 text-sm leading-relaxed text-foreground",
                              errors.context &&
                                "border-destructive focus:border-destructive bg-destructive/10",
                            )}
                          />
                        )}
                      />
                      <div className="flex justify-between text-xs">
                        <span
                          className={cn(
                            "text-muted-foreground",
                            errors.context && "text-destructive",
                          )}
                        >
                          {watch("context")?.length || 0} / 1000 caracteres
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Messages Section */}
                  <div className="space-y-5">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-foreground">Variantes de mensagem</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Configure o hook e o corpo da mensagem para cada variante
                      </p>
                    </div>

                    {/* Message Cards */}
                    <div className="space-y-3">
                      {Object.entries(watchedMessages || {}).map(([variant, message], index) => {
                        const isControl = variant === "control";
                        const isFirstVariant = variant === "variant_a";
                        const canRemove = !isControl && !isFirstVariant;

                        return (
                          <Card
                            key={variant}
                            className={cn(
                              "transition-all duration-300 relative overflow-hidden",
                              "animate-in fade-in-0 slide-in-from-bottom-2",
                              isControl
                                ? "p-5 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20"
                                : "p-4 bg-gradient-to-br from-card to-background/50 border-border hover:border-accent hover:shadow-sm",
                            )}
                            style={{ animationDelay: `${index * 40}ms` }}
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    isControl
                                      ? "bg-gradient-to-br from-primary to-primary/60 animate-pulse shadow-sm"
                                      : "bg-muted-foreground",
                                  )}
                                />
                                <span className="text-sm font-semibold text-foreground">
                                  {getVariantName(variant)}
                                </span>
                                {isControl && (
                                  <Badge
                                    variant="default"
                                    className="h-4 text-[10px] px-1.5 font-bold bg-gradient-to-r from-primary to-primary/80"
                                  >
                                    BASE
                                  </Badge>
                                )}
                              </div>
                              {canRemove && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      onClick={() => removeVariant(variant)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark">
                                    <p className="text-xs">Remover variante</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>

                            {/* Hook Field */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Label
                                  htmlFor={`${variant}_hook`}
                                  className="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                                >
                                  HOOK
                                </Label>
                                {getFieldError(variant, "hook") && (
                                  <Badge variant="destructive" className="h-4 text-[9px] px-1">
                                    {getFieldError(variant, "hook")}
                                  </Badge>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                                      <HelpCircle className="h-2.5 w-2.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[200px] dark">
                                    <p className="text-[11px] leading-relaxed">
                                      Título chamativo para capturar atenção imediata (3-100
                                      caracteres)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Controller
                                name={`messages.${variant}.hook`}
                                control={control}
                                render={({ field }) => (
                                  <Textarea
                                    {...field}
                                    id={`${variant}_hook`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      autoResize(e.target);
                                      trigger(`messages.${variant}.hook`);
                                    }}
                                    placeholder="Ex: Você no controle 🚀"
                                    className={cn(
                                      "min-h-[40px] resize-none bg-background border-border",
                                      "placeholder:text-muted-foreground focus:border-primary focus:bg-card",
                                      "text-sm font-medium leading-relaxed transition-all duration-200 text-foreground",
                                      getFieldError(variant, "hook") &&
                                        "border-destructive focus:border-destructive bg-destructive/10",
                                    )}
                                    rows={1}
                                  />
                                )}
                              />
                              <div className="text-xs text-muted-foreground text-right">
                                {message?.hook?.length || 0} / 100
                              </div>
                            </div>

                            <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                            {/* Body Field */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Label
                                  htmlFor={`${variant}_body`}
                                  className="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                                >
                                  MENSAGEM
                                </Label>
                                {getFieldError(variant, "body") && (
                                  <Badge variant="destructive" className="h-4 text-[9px] px-1">
                                    {getFieldError(variant, "body")}
                                  </Badge>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                                      <HelpCircle className="h-2.5 w-2.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[200px] dark">
                                    <p className="text-[11px] leading-relaxed">
                                      Corpo da mensagem com a proposta de valor completa (10-500
                                      caracteres)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Controller
                                name={`messages.${variant}.body`}
                                control={control}
                                render={({ field }) => (
                                  <Textarea
                                    {...field}
                                    id={`${variant}_body`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      autoResize(e.target);
                                      trigger(`messages.${variant}.body`);
                                    }}
                                    placeholder="Ex: Seu cartão pré-pago desconta as compras diretamente do saldo..."
                                    className={cn(
                                      "min-h-[72px] resize-none bg-background border-border",
                                      "placeholder:text-muted-foreground focus:border-primary focus:bg-card",
                                      "text-sm leading-relaxed transition-all duration-200 text-foreground",
                                      getFieldError(variant, "body") &&
                                        "border-destructive focus:border-destructive bg-destructive/10",
                                    )}
                                    rows={3}
                                  />
                                )}
                              />
                              <div className="text-xs text-muted-foreground text-right">
                                {message?.body?.length || 0} / 500
                              </div>
                            </div>
                          </Card>
                        );
                      })}

                      {/* Add Variant Button */}
                      {variantCount < 5 ? (
                        <button
                          type="button"
                          onClick={addVariant}
                          className="w-full py-3.5 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/30
                                   bg-transparent hover:bg-primary/5
                                   transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Plus className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-muted-foreground/70 group-hover:text-primary transition-colors">
                              Adicionar nova variante
                            </span>
                            <span className="text-xs text-muted-foreground/40">
                              • {5 - variantCount}{" "}
                              {5 - variantCount === 1 ? "restante" : "restantes"}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="w-full py-3.5 rounded-xl border-2 border-dashed border-muted-foreground/10
                                         bg-muted/10 cursor-not-allowed"
                            >
                              <div className="flex items-center justify-center gap-2 opacity-40">
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Limite de variantes atingido
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="dark max-w-xs">
                            <p className="text-xs leading-relaxed">
                              <strong>Limite máximo atingido</strong>
                              <br />
                              Você já tem 5 variantes configuradas. Para adicionar uma nova, remova
                              uma das variantes existentes (exceto Controle e Variante A).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-8 py-3.5 border-t border-border bg-gradient-to-t from-card via-card to-background/50 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 text-xs font-bold border-border">
                      {Object.keys(watchedMessages || {}).length}{" "}
                      {Object.keys(watchedMessages || {}).length === 1 ? "versão" : "versões"}
                    </Badge>
                    <Separator orientation="vertical" className="h-4 bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">
                      10 agentes testarão cada variante
                    </span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-9 px-5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  disabled={isSubmitting}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Iniciar teste
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
