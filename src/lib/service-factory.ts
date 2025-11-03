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
        const zombieConstants = await import('./config-agents/clients/game-zombie/constant');
        const zombiePrompts = await import('./config-agents/clients/game-zombie/prompt');
        service = {
          constants: zombieConstants.UI_MESSAGES,
          config: zombieConstants.GAME_CONFIG,
          prompts: zombiePrompts.GAME_PROMPTS,
          type: 'game-zombie'
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

      case 'agent-standar':
        const standarConstants = await import('./config-agents/agent-standar/constant');
        const standarPrompts = await import('./config-agents/agent-standar/prompt');
        service = {
          constants: standarConstants.UI_MESSAGES,
          config: standarConstants.GAME_CONFIG,
          prompts: standarPrompts.GAME_PROMPTS,
          type: 'agent-standar'
        };
        break;

      case 'client-claim':
        const clientClaimConstants = await import('./config-agents/clients/client-claim/constant');
        const clientClaimPrompts = await import('./config-agents/clients/client-claim/prompt');
        service = {
          constants: clientClaimConstants.UI_MESSAGES,
          config: clientClaimConstants.GAME_CONFIG,
          prompts: clientClaimPrompts.GAME_PROMPTS,
          type: 'client-claim'
        };
        break;

      case 'desperate-client':
        const desperateClientConstants = await import('./config-agents/clients/desperate-client/constant');
        const desperateClientPrompts = await import('./config-agents/clients/desperate-client/prompt');
        service = {
          constants: desperateClientConstants.UI_MESSAGES,
          config: desperateClientConstants.GAME_CONFIG,
          prompts: desperateClientPrompts.GAME_PROMPTS,
          type: 'desperate-client'
        };
        break;

      case 'angry-client':
        
        const angryClientConstants = await import('./config-agents/clients/angry-client/constant');
        const angryClientPrompts = await import('./config-agents/clients/angry-client/prompt');
        service = {
          constants: angryClientConstants.UI_MESSAGES,
          config: angryClientConstants.GAME_CONFIG,
          prompts: angryClientPrompts.GAME_PROMPTS,
          type: 'angry-client'
        };
        break;
      
      case 'response-tools':
        const responseToolsPrompts = await import('./config-agents/response-tools/prompts');
        service = {
          constants: {} as any,
          config: {} as any,
          prompts: responseToolsPrompts.GAME_PROMPTS,
          type: 'response-tools'
        };
        break;

      case 'promocion-no-respetada':
        const promocionConstants = await import('./config-agents/clients/promocion-no-respetada/constant');
        const promocionPrompts = await import('./config-agents/clients/promocion-no-respetada/prompt');
        service = {
          constants: promocionConstants.UI_MESSAGES,
          config: promocionConstants.GAME_CONFIG,
          prompts: promocionPrompts.GAME_PROMPTS,
          type: 'promocion-no-respetada'
        };
        break;

      case 'retraso-entrega':
        const retrasoConstants = await import('./config-agents/clients/retraso-entrega/constant');
        const retrasoPrompts = await import('./config-agents/clients/retraso-entrega/prompt');
        service = {
          constants: retrasoConstants.UI_MESSAGES,
          config: retrasoConstants.GAME_CONFIG,
          prompts: retrasoPrompts.GAME_PROMPTS,
          type: 'retraso-entrega'
        };
        break;

      case 'pedido-cancelado':
        const pedidoCanceladoConstants = await import('./config-agents/clients/pedido-cancelado/constant');
        const pedidoCanceladoPrompts = await import('./config-agents/clients/pedido-cancelado/prompt');
        service = {
          constants: pedidoCanceladoConstants.UI_MESSAGES,
          config: pedidoCanceladoConstants.GAME_CONFIG,
          prompts: pedidoCanceladoPrompts.GAME_PROMPTS,
          type: 'pedido-cancelado'
        };
        break;

      case 'producto-incorrecto':
        const productoIncorrectoConstants = await import('./config-agents/clients/producto-incorrecto/constant');
        const productoIncorrectoPrompts = await import('./config-agents/clients/producto-incorrecto/prompt');
        service = {
          constants: productoIncorrectoConstants.UI_MESSAGES,
          config: productoIncorrectoConstants.GAME_CONFIG,
          prompts: productoIncorrectoPrompts.GAME_PROMPTS,
          type: 'producto-incorrecto'
        };
        break;

      case 'producto-defectuoso':
        const productoDefectuosoConstants = await import('./config-agents/clients/producto-defectuoso/constant');
        const productoDefectuosoPrompts = await import('./config-agents/clients/producto-defectuoso/prompt');
        service = {
          constants: productoDefectuosoConstants.UI_MESSAGES,
          config: productoDefectuosoConstants.GAME_CONFIG,
          prompts: productoDefectuosoPrompts.GAME_PROMPTS,
          type: 'producto-defectuoso'
        };
        break;

      case 'dificultad-devolucion':
        const dificultadDevolucionConstants = await import('./config-agents/clients/dificultad-devolucion/constant');
        const dificultadDevolucionPrompts = await import('./config-agents/clients/dificultad-devolucion/prompt');
        service = {
          constants: dificultadDevolucionConstants.UI_MESSAGES,
          config: dificultadDevolucionConstants.GAME_CONFIG,
          prompts: dificultadDevolucionPrompts.GAME_PROMPTS,
          type: 'dificultad-devolucion'
        };
        break;

      case 'reembolso-tardio':
        const reembolsoTardioConstants = await import('./config-agents/clients/reembolso-tardio/constant');
        const reembolsoTardioPrompts = await import('./config-agents/clients/reembolso-tardio/prompt');
        service = {
          constants: reembolsoTardioConstants.UI_MESSAGES,
          config: reembolsoTardioConstants.GAME_CONFIG,
          prompts: reembolsoTardioPrompts.GAME_PROMPTS,
          type: 'reembolso-tardio'
        };
        break;

      case 'cobro-indebido':
        const cobroIndebidoConstants = await import('./config-agents/clients/cobro-indebido/constant');
        const cobroIndebidoPrompts = await import('./config-agents/clients/cobro-indebido/prompt');
        service = {
          constants: cobroIndebidoConstants.UI_MESSAGES,
          config: cobroIndebidoConstants.GAME_CONFIG,
          prompts: cobroIndebidoPrompts.GAME_PROMPTS,
          type: 'cobro-indebido'
        };
        break;

      case 'problema-garantia':
        const problemaGarantiaConstants = await import('./config-agents/clients/problema-garantia/constant');
        const problemaGarantiaPrompts = await import('./config-agents/clients/problema-garantia/prompt');
        service = {
          constants: problemaGarantiaConstants.UI_MESSAGES,
          config: problemaGarantiaConstants.GAME_CONFIG,
          prompts: problemaGarantiaPrompts.GAME_PROMPTS,
          type: 'problema-garantia'
        };
        break;

      case 'mala-atencion':
        const malaAtencionConstants = await import('./config-agents/clients/mala-atencion/constant');
        const malaAtencionPrompts = await import('./config-agents/clients/mala-atencion/prompt');
        service = {
          constants: malaAtencionConstants.UI_MESSAGES,
          config: malaAtencionConstants.GAME_CONFIG,
          prompts: malaAtencionPrompts.GAME_PROMPTS,
          type: 'mala-atencion'
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
        id: 'agent-standar',
        name: 'Agent Standar',
        description: 'Asistente AI versátil con acceso a herramientas locales y MCP'
      },
      {
        id: 'game-zombie',
        name: 'Zombie Apocalypse',
        description: 'Aventura de supervivencia en un mundo post-apocalíptico'
      }
    ];
  }
}
