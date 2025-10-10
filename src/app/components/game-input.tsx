import { PromptInput, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { UI_MESSAGES } from "@/lib/services/game-zombie/constant";

interface GameInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isDisabled?: boolean; // Nuevo: prop para deshabilitar el input
}

export function GameInput({ input, onInputChange, onSubmit, isLoading, isDisabled = false }: GameInputProps) {
  const inputTrimmed = input.trim();
  const inputIsDisabled = isLoading || !inputTrimmed || isDisabled; // Incluir el nuevo prop en la lógica de deshabilitación
  return (
    <PromptInput onSubmit={(_, e) => onSubmit(e)} className="relative pr-8">
      <PromptInputTextarea
        placeholder={UI_MESSAGES.PLACEHOLDER.STORY}
        value={input}
        onChange={onInputChange}
        disabled={isLoading || isDisabled} // Aplicar disabled aquí también
      />
      <PromptInputSubmit disabled={inputIsDisabled} className="absolute bottom-2 right-2"/>
    </PromptInput>
  );
}
