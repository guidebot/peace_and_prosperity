# Project: Peace and Prosperity

## Project Description
Gamemaster driven cooperative roleplaying wargame.

## Project Structure
- `src/` typescript/react single-page web application
  - `App.jsx` main application
  - `tree/` arborist tree showing sides, units and persons
  - `utils/` common functions
  - `game/` game models, databases (equipment, vehicles, names and so on)
  - `cards/` visual components (forms)
  - `actions/` modal windows
- `doc/` game documentation
  - `contract.docx` core rules
  - `peace_and_prosperity_masters_book.docx` campagain description

## General Instructions:
- Prefer typescript over javascript.
- Follow SOLID and DRY principles.
- Before making changes, summarize the approach with a brief plan and get user approval.
- When planning use sequential-thinking MCP and TRIZ methodology.
- Use exa MCP for web-search.
- When adding a new library or framework or starting a new project always check context7 for updates about the used libraries and frameworks.

## Coding Style:
- Do not add comments in generated code or markup.
- Try to put styles into CSS files.
- Use language-specific naming conventions:
  - C#: PascalCase for public members, camelCase for private fields.
  - JavaScript/TypeScript: PascalCase for exports, camelCase for internal.
  - File names:
    - React components (.jsx, .tsx): PascalCase (e.g., `PersonForm.tsx`)
    - TypeScript classes/models (.ts): PascalCase (e.g., `Entity.ts`)
    - Utility modules (.ts, .js): camelCase (e.g., `utils.ts`)
