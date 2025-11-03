import { PromptInput, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UI_MESSAGES } from "@/lib/config-agents/clients/game-zombie/constant";

interface GameInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  mode: 'automatic' | 'custom'; // Nuevo prop
}

export function GameInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  isDisabled,
  mode,
}: GameInputProps) {
  // No renderizar nada si el modo es automático
  if (mode === 'automatic') {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <Textarea
        value={input}
        onChange={onInputChange}
        placeholder="Escribe tu mensaje aquí..."
        className="flex-1 resize-none rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
        rows={2}
        disabled={isDisabled || isLoading}
      />
      <Button type="submit" disabled={isLoading || !input.trim() || isDisabled} className="h-full">
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          'Enviar'
        )}
      </Button>
    </form>
  );
}
