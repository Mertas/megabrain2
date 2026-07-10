import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

// ─── Paths ───────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── ANSI ────────────────────────────────────────────────────────────────────

const C = {
  r: '\x1b[0m',
  b: '\x1b[1m',
  d: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  white: '\x1b[97m',
  bgCyan: '\x1b[46m',
  black: '\x1b[30m',
};

const icons = { rocket: '🚀', test: '🧪', db: '🗄️', check: '✅', play: '▶', gui: '🖥️' };

// ─── Terminal helpers ────────────────────────────────────────────────────────

function clear() { process.stdout.write('\x1b[2J\x1b[H'); }
function hideCursor() { process.stdout.write('\x1b[?25l'); }
function showCursor() { process.stdout.write('\x1b[?25h'); }

// ─── Script definitions ──────────────────────────────────────────────────────

function loadScripts() {
  const cypressDir = join(ROOT, 'packages', 'frontend', 'cypress', 'e2e');
  const specFiles = existsSync(cypressDir)
    ? readdirSync(cypressDir).filter(f => f.endsWith('.cy.ts')).sort()
    : [];

  const specItems = specFiles.length > 0
    ? [
        { label: `${C.d}── Run individual spec (headless) ──${C.r}`, type: 'label' },
        ...specFiles.map(f => ({
          label: `  ${C.d}└${C.r} ${f.replace('.cy.ts', '')}`,
          cmd: `npm run seed:test-users --prefix ../backend && npx cypress run --spec "cypress/e2e/${f}"`,
          cwd: join(ROOT, 'packages', 'frontend'),
          key: `spec:${f}`,
        })),
      ]
    : [];

  const groups = [
    {
      title: `${icons.rocket}  Dev & Build`,
      color: C.cyan,
      items: [
        { label: 'Start Dev (frontend + backend)',  cmd: 'npm run dev',               key: 'dev' },
        { label: 'Build All',                        cmd: 'npm run build',             key: 'build' },
        { label: 'Start Production',                 cmd: 'npm run start',             key: 'start' },
        { label: 'Frontend Dev Only',                cmd: 'npm run dev -w packages/frontend', key: 'dev:fe' },
        { label: 'Backend Dev Only',                 cmd: 'npm run dev -w packages/backend',  key: 'dev:be' },
        { label: 'Frontend Lint',                    cmd: 'npm run lint -w packages/frontend', key: 'lint' },
        { label: 'Cosmos (Component Playground)',    cmd: 'npm run cosmos',            key: 'cosmos' },
      ],
    },
    {
      title: `${icons.test}  Tests`,
      color: C.green,
      items: [
        { label: 'Run ALL Tests (headless)',         cmd: 'npm run test:all -w packages/frontend',  key: 'test:all' },
        { label: 'Auth Tests (headless)',             cmd: 'npm run test:auth -w packages/frontend', key: 'test:auth' },
        { label: 'Solo Game Tests (headless)',        cmd: 'npm run test:game -w packages/frontend', key: 'test:game' },
        { label: `${C.b}${icons.gui}  Open Cypress GUI${C.r}`, cmd: 'npx cypress open --e2e', cwd: join(ROOT, 'packages', 'frontend'), key: 'cypress:gui' },
        ...specItems,
      ],
    },
    {
      title: `${icons.db}  Database`,
      color: C.yellow,
      items: [
        { label: 'Setup DB + Seed',  cmd: 'npm run db:seed',                              key: 'db:seed' },
        { label: 'Seed Test Users',  cmd: 'npm run seed:test-users -w packages/backend',  key: 'seed:test-users' },
        { label: 'DB Setup Only',    cmd: 'npm run db:setup -w packages/backend',         key: 'db:setup' },
        { label: 'Seed Data Only',   cmd: 'npm run seed -w packages/backend',             key: 'seed' },
      ],
    },
  ];

  return { groups };
}

// ─── Menu rendering ──────────────────────────────────────────────────────────

function flattenMenu(groups) {
  const entries = [];
  let id = 0;

  entries.push({ id: id++, type: 'header', label: '' });
  entries.push({ id: id++, type: 'header', label: `${C.b}${C.cyan}╭─────────────────────────────────────────────╮${C.r}` });
  entries.push({ id: id++, type: 'header', label: `${C.b}${C.cyan}│${C.r}     ${C.b}${C.yellow}MEGABRAIN2 ${C.d}Interactive Runner${C.r}        ${C.b}${C.cyan}│${C.r}` });
  entries.push({ id: id++, type: 'header', label: `${C.b}${C.cyan}╰─────────────────────────────────────────────╯${C.r}` });
  entries.push({ id: id++, type: 'header', label: '' });

  for (const g of groups) {
    entries.push({ id: id++, type: 'group-header', label: `  ${g.color}${C.b}${g.title}${C.r}`, group: g });
    for (const item of g.items) {
      if (item.type === 'label') {
        entries.push({ id: id++, type: 'header', label: `    ${item.label}` });
      } else {
        entries.push({ id: id++, type: 'item', label: item.label, item, group: g });
      }
    }
    entries.push({ id: id++, type: 'spacer', label: '' });
  }

  entries.push({ id: id++, type: 'header', label: `  ${C.d}↑↓ navigate  ↵ select  q quit${C.r}` });
  entries.push({ id: id++, type: 'header', label: '' });

  return entries;
}

function getSelectable(entries) {
  return entries.filter(e => e.type === 'item');
}

function render(entries, selectedIdx, selectable) {
  clear();
  const sel = selectable || getSelectable(entries);
  const selId = selectedIdx !== undefined ? sel[selectedIdx]?.id : -1;

  const lines = [];
  for (const e of entries) {
    let line;
    if (e.type === 'header') {
      line = `    ${e.label}`;
    } else if (e.type === 'group-header') {
      line = `    ${e.label}`;
    } else if (e.type === 'item') {
      const isSelected = e.id === selId;
      const prefix = isSelected
        ? ` ${C.bgCyan}${C.black} ${icons.play} ${C.r}`
        : `   `;
      const suffix = isSelected ? ` ` : '';
      line = `${prefix}${isSelected ? C.b + C.cyan : C.r}${e.label}${C.r}${suffix}`;
    } else if (e.type === 'spacer') {
      line = '';
    }
    if (line !== undefined) lines.push(line);
  }

  process.stdout.write(lines.join('\n'));
  return sel;
}

// ─── Keypress loop ───────────────────────────────────────────────────────────

function prompt(entries) {
  return new Promise((resolve) => {
    const selectable = getSelectable(entries);
    let idx = 0;
    let rendered = false;

    function draw() {
      render(entries, idx, selectable);
      rendered = true;
    }

    function onKeypress(str, key) {
      if (!rendered) return;

      if (key.name === 'up' || key.name === 'k') {
        idx = (idx - 1 + selectable.length) % selectable.length;
        draw();
      } else if (key.name === 'down' || key.name === 'j') {
        idx = (idx + 1) % selectable.length;
        draw();
      } else if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        resolve(selectable[idx]);
      } else if (key.name === 'q' || key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup();
        resolve(null);
      }
    }

    function cleanup() {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      showCursor();
    }

    hideCursor();
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKeypress);
    draw();
  });
}

// ─── Command execution ───────────────────────────────────────────────────────

function runCommand(item) {
  clear();
  showCursor();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);

  const cwd = item.cwd || ROOT;
  const cmd = item.cmd;

  console.log(`\n  ${C.b}${C.green}${icons.play} Running:${C.r} ${C.yellow}${cmd}${C.r}`);
  console.log(`  ${C.d}in ${cwd}${C.r}\n`);
  console.log(`${C.d}${'─'.repeat(Math.min(process.stdout.columns - 2 || 78, 80))}${C.r}\n`);

  return new Promise((resolve) => {
    const child = spawn(cmd, [], {
      cwd,
      shell: true,
      stdio: 'inherit',
      windowsHide: false,
    });

    child.on('close', (code) => {
      console.log(`\n  ${C.d}${'─'.repeat(Math.min(process.stdout.columns - 2 || 78, 80))}${C.r}`);
      if (code === 0) {
        console.log(`\n  ${C.green}${C.b}${icons.check}  Done!${C.r}\n`);
      } else {
        console.log(`\n  ${C.red}${C.b}x  Exited with code ${code}${C.r}\n`);
      }
      resolve(code);
    });

    child.on('error', (err) => {
      console.log(`\n  ${C.red}x  Failed: ${err.message}${C.r}\n`);
      resolve(1);
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { groups } = loadScripts();
  const entries = flattenMenu(groups);

  process.on('SIGINT', () => {
    showCursor();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.exit(0);
  });

  while (true) {
    const choice = await prompt(entries);

    if (!choice || !choice.item) {
      clear();
      console.log(`\n  ${C.d}Bye!${C.r}\n`);
      break;
    }

    await runCommand(choice.item);

    console.log(`  ${C.d}Press any key to return to menu...${C.r}`);
    await new Promise((res) => {
      const onData = (buf) => {
        const s = buf.toString();
        if (s === '\x03') { process.exit(0); }
        process.stdin.removeListener('data', onData);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        res();
      };
      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    });
  }

  process.exit(0);
}

main().catch((err) => {
  showCursor();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  console.error(C.red + 'Fatal:' + C.r, err.message);
  process.exit(1);
});
