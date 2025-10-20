import { GameService, ServiceType } from './types';

export class ServiceFactory {
  private static services: Map<ServiceType, GameService> = new Map();

  static async getService(serviceType: ServiceType): Promise<GameService> {
    if (this.services.has(serviceType)) {
      return this.services.get(serviceType)!;
    }

    let service: GameService;
    
    switch (serviceType) {
      case 'game-zombie':
        const zombieConstants = await import('./config-agents/game-zombie/constant');
        const zombiePrompts = await import('./config-agents/game-zombie/prompt');
        service = {
          constants: zombieConstants.UI_MESSAGES,
          config: zombieConstants.GAME_CONFIG,
          prompts: zombiePrompts.GAME_PROMPTS,
          type: 'game-zombie'
        };
        break;
        
      case 'business-strategy':
        const businessConstants = await import('./config-agents/business-strategy/constant');
        const businessPrompts = await import('./config-agents/business-strategy/prompt');
        service = {
          constants: businessConstants.UI_MESSAGES,
          config: businessConstants.GAME_CONFIG,
          prompts: businessPrompts.GAME_PROMPTS,
          type: 'business-strategy'
        };
        break;

      case 'agent-resolutor':
        // por ahora solo vamos a usar este servicio de agent-resolutor luego lo cambiamos a conversation
        const conversationConstants = await import('./config-agents/agent-resolutor/constant');
        const conversationPrompts = await import('./config-agents/agent-resolutor/prompt');
        service = {
          constants: conversationConstants.UI_MESSAGES,
          config: conversationConstants.GAME_CONFIG,
          prompts: conversationPrompts.GAME_PROMPTS,
          type: 'agent-resolutor'
        };
        break;

      case 'client-claim':
        const clientClaimConstants = await import('./config-agents/client-claim/constant');
        const clientClaimPrompts = await import('./config-agents/client-claim/prompt');
        service = {
          constants: clientClaimConstants.UI_MESSAGES,
          config: clientClaimConstants.GAME_CONFIG,
          prompts: clientClaimPrompts.GAME_PROMPTS,
          type: 'client-claim'
        };
        break;

      case 'desperate-client':
        const desperateClientConstants = await import('./config-agents/desperate-client/constant');
        const desperateClientPrompts = await import('./config-agents/desperate-client/prompt');
        service = {
          constants: desperateClientConstants.UI_MESSAGES,
          config: desperateClientConstants.GAME_CONFIG,
          prompts: desperateClientPrompts.GAME_PROMPTS,
          type: 'desperate-client'
        };
        break;

      case 'angry-client':
        const angryClientConstants = await import('./config-agents/angry-client/constant');
        const angryClientPrompts = await import('./config-agents/angry-client/prompt');
        service = {
          constants: angryClientConstants.UI_MESSAGES,
          config: angryClientConstants.GAME_CONFIG,
          prompts: angryClientPrompts.GAME_PROMPTS,
          type: 'angry-client'
        };
        break;

      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }

    this.services.set(serviceType, service);
    return service;
  }

  static getAvailableServices(): Array<{id: ServiceType, name: string, description: string}> {
    return [
      {
        id: 'agent-resolutor',
        name: 'Agent Resolutor',
        description: 'Resolutor de problemas de un agente de atención al cliente'
      },
      {
        id: 'game-zombie',
        name: 'Zombie Apocalypse',
        description: 'Aventura de supervivencia en un mundo post-apocalíptico'
      }
    ];
  }
}
