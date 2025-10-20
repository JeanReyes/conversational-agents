import { Image } from "@/components/ai-elements/image";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { UI_MESSAGES } from "@/lib/config-agents/game-zombie/constant";
import type { GameMessage as GameMessageType, ServiceType } from "@/lib/types";

export function GameMessage({ message, serviceType }: { message: GameMessageType, serviceType: ServiceType }) {
  const { image, content, role, imageLoading } = message;
  //const imageLoading = true;
  return (
    <Message from={role}>
      <MessageContent>
        {role === "assistant" &&
          serviceType !==
            "agent-resolutor" && (
              <picture className="w-full max-w-2xl aspect-video overflow-hidden rounded-md">
                {imageLoading && (
                  <div className="w-full h-full flex items-center justify-center bg-black/10">
                    <div className="flex mb-4 space-x-2">
                      <Loader />
                      <span>{UI_MESSAGES.LOADING.IMAGE}</span>
                    </div>
                  </div>
                )}

                {image && (
                  <Image
                    base64={image.base64Data}
                    uint8Array={image.uint8ArrayData || new Uint8Array()}
                    mediaType={image.mediaType}
                    alt="Imagen de la historia"
                    className="w-full h-full object-cover object-center pixelated"
                  />
                )}
              </picture>
            )}

        <Response>{content}</Response>
      </MessageContent>
    </Message>
  );
}