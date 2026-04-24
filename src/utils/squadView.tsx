import { Player } from '../game/Player';
import { Unit } from '../game/Unit';
import { Entity } from '../game/Entity';

export function generateSquadViewHTML(players: Player[]): string {
  let html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Список отряда</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #fff;
          color: #000;
          margin: 20px;
        }
        h1 {
          text-align: center;
        }
        .player {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .player-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .unit {
          margin-bottom: 20px;
          border: 1px solid #ccc;
          padding: 10px;
          page-break-inside: avoid;
        }
        .unit-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .vehicle {
          font-style: italic;
          margin-bottom: 10px;
        }
        .soldier {
          margin-bottom: 15px;
          border-left: 2px solid #999;
          padding-left: 10px;
        }
        .soldier-name {
          font-size: 18px;
          font-weight: bold;
        }
        .skills, .equipment {
          margin-top: 5px;
        }
        .skill-item, .equip-item {
          display: inline-block;
          margin-right: 10px;
          font-size: 14px;
        }
        @media print {
          body {
            background-color: #fff;
            color: #000;
          }
          .unit {
            border: 1px solid #999;
          }
        }
      </style>
    </head>
    <body>
      <h1>Список отряда</h1>
  `;

  players.forEach((player, pIndex) => {
    html += `
      <div class="player">
        <div class="player-name">Игрок: ${player.name}</div>
    `;
    player.children?.forEach((unit, uIndex) => {
      html += `
        <div class="unit">
          <div class="unit-name">Отряд: ${unit.name}</div>
      `;
      if (unit.vehicle) {
        html += `<div class="vehicle">Транспорт: ${unit.vehicle.name}</div>`;
      }
      unit.children?.forEach((entity, eIndex) => {
        html += `
          <div class="soldier">
            <div class="soldier-name">Лицо: ${entity.name}</div>
            <div class="skills"><strong>Навыки:</strong>
        `;
        const skills = entity.skills;
        for (const skillName of Object.keys(skills)) {
          const value = skills[skillName];
          html += `<span class="skill-item">${skillName}: ${value}</span> `;
        }
        html += `</div>`;
        html += `<div class="equipment"><strong>Снаряжение:</strong> `;
        if (entity.equipment && entity.equipment.length > 0) {
          entity.equipment.forEach((equip, eqIndex) => {
            html += `<span class="equip-item">${equip.name}`;
            if (equip.ammo !== undefined && equip.ammo > 0) {
              html += ` (боеприпасы: ${equip.ammo})`;
            }
            html += `</span> `;
          });
        } else {
          html += `Отсутствует`;
        }
        html += `</div>`;
        html += `</div>`;
      });
      html += `</div>`; // end unit
    });
    html += `</div>`; // end player
  });

  html += `
    </body>
    </html>
  `;

  return html;
}