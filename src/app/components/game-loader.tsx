import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";

export function GameLoader() {
  return (
    <Message from='assistant'>
      <MessageContent>
        <div className="flex items-center gap-2">
          <Loader/>
          generando experiencia...
        </div>
      </MessageContent>
    </Message>
  );
}