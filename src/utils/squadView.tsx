import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import Handlebars from 'handlebars';
import template from './squadTemplate.hbs?raw';

Handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});

Handlebars.registerHelper('skillColor', function (value) {
  if (value >= 16) return 'skill-exceptional';
  if (value >= 12) return 'skill-good';
  if (value >= 7) return 'skill-mediocre';
  return 'skill-bad';
});

const compiledTemplate = Handlebars.compile(template);

function padTo<T>(arr: T[], size: number, filler: T): T[] {
  const result = [...arr];
  while (result.length < size) {
    result.push(filler);
  }
  return result.slice(0, size);
}

export function generateSquadViewHTML(players: Player[]): string {
  const payload = players.map(player => {
    const paddedUnits = player.children.map(unit => ({
      ...unit,
      children: padTo(unit.children || [], 13, new Entity("", {}, []))
    }));
    return {
      ...player,
      children: paddedUnits
    };
  });
  return compiledTemplate({ players: payload });
}