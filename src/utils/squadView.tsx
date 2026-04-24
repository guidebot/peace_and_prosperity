import { Player } from '../game/Player';
import { Unit } from '../game/Unit';
import { Entity } from '../game/Entity';
import Handlebars from 'handlebars';
import template from './squadTemplate.hbs?raw';

// Compile template once for performance
const compiledTemplate = Handlebars.compile(template);

export function generateSquadViewHTML(players: Player[]): string {
  return compiledTemplate({ players });
}