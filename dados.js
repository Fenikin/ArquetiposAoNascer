const DADOS = [
  { tipo: 'd20', lados: 20, svg: 'M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z' },
  { tipo: 'd12', lados: 12, svg: 'M12 2 L20 6 L22 15 L16 21 L8 21 L2 15 L4 6 Z' },
  { tipo: 'd10', lados: 10, svg: 'M12 2 L20 9 L17 20 L7 20 L4 9 Z' },
  { tipo: 'd8',  lados: 8,  svg: 'M12 2 L22 12 L12 22 L2 12 Z' },
  { tipo: 'd6',  lados: 6,  svg: 'M4 4 H20 V20 H4 Z' },
  { tipo: 'd4',  lados: 4,  svg: 'M12 3 L22 21 L2 21 Z' },
];
 
const MAX_HISTORICO = 10;
 
// Estado da aplicação
const estado = {
  dadoSelecionado: null,
  quantidade: 1,
  historico: [],
  rolando: false,
};

function criarWidget() {
  // Botão flutuante
  const botaoFlutuante = document.createElement('button');
  botaoFlutuante.id = 'btn-dados-flutuante';
  botaoFlutuante.setAttribute('aria-label', 'Abrir rolador de dados');
  botaoFlutuante.innerHTML = '🎲';
  botaoFlutuante.title = 'Rolador de Dados';
  document.body.appendChild(botaoFlutuante);
 
  // Painel principal
  const painel = document.createElement('div');
  painel.id = 'painel-dados';
  painel.setAttribute('aria-hidden', 'true');
  painel.innerHTML = `
    <div class="dados-header">
      <span class="dados-titulo">⚔️ Rolador de Dados</span>
      <button class="dados-fechar" id="btn-fechar-dados" aria-label="Fechar">✕</button>
    </div>
 
    <div class="dados-grid" role="group" aria-label="Selecione o dado">
      ${DADOS.map(d => `
        <button class="dado-btn" data-tipo="${d.tipo}" data-lados="${d.lados}" aria-pressed="false" title="${d.tipo}">
          <svg viewBox="0 0 24 24" class="dado-svg" aria-hidden="true">
            <path d="${d.svg}" />
          </svg>
          <span>${d.tipo}</span>
        </button>
      `).join('')}
    </div>
 
    <div class="dados-quantidade">
      <label for="qtd-dados">Quantidade:</label>
      <div class="qtd-controle">
        <button id="qtd-menos" aria-label="Diminuir quantidade">−</button>
        <input id="qtd-dados" type="number" min="1" max="20" value="1" aria-label="Quantidade de dados">
        <button id="qtd-mais" aria-label="Aumentar quantidade">+</button>
      </div>
    </div>
 
    <button class="btn-rolar" id="btn-rolar" disabled>
      <span id="btn-rolar-texto">Selecione um dado</span>
    </button>
 
    <div class="resultado-area" id="resultado-area" aria-live="polite" aria-atomic="true">
      <div class="resultado-vazio">Escolha um dado e role!</div>
    </div>
 
    <div class="historico-area" id="historico-area">
      <div class="historico-titulo">Histórico</div>
      <ul class="historico-lista" id="historico-lista" aria-label="Histórico de rolagens">
        <li class="historico-vazio">Nenhuma rolagem ainda.</li>
      </ul>
      <button class="btn-limpar" id="btn-limpar">Limpar Histórico</button>
    </div>
  `;
  document.body.appendChild(painel);
 
  injetarEstilos();
  registrarEventos(botaoFlutuante, painel);
}
 
// ─── Estilos ─────────────────────────────────────────────────
 
function injetarEstilos() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Botão flutuante ── */
    #btn-dados-flutuante {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 1050;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8b0000, #5a0000);
      border: 3px solid #d4af37;
      color: #fff;
      font-size: 1.6rem;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 10px rgba(212,175,55,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    #btn-dados-flutuante:hover {
      transform: scale(1.12) rotate(-8deg);
      box-shadow: 0 6px 24px rgba(0,0,0,0.7), 0 0 18px rgba(212,175,55,0.5);
    }
    #btn-dados-flutuante.aberto {
      transform: scale(1.05) rotate(15deg);
    }
 
    /* ── Painel ── */
    #painel-dados {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 1049;
      width: 320px;
      background: linear-gradient(160deg, #2c1e16 0%, #1a1008 100%);
      border: 2px solid #d4af37;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.3);
      font-family: 'Georgia', serif;
      color: #e0d1b0;
      overflow: hidden;
 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    #painel-dados.visivel {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
 
    /* ── Header ── */
    .dados-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(to bottom, #3d2b1f, #2c1e16);
      border-bottom: 2px solid #8b0000;
    }
    .dados-titulo {
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      color: #d4af37;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .dados-fechar {
      background: none;
      border: 1px solid #8b0000;
      color: #e0d1b0;
      border-radius: 4px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.2s, color 0.2s;
    }
    .dados-fechar:hover {
      background: #8b0000;
      color: #fff;
    }
 
    /* ── Grid de dados ── */
    .dados-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 14px;
    }
    .dado-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid #3d2b1f;
      border-radius: 6px;
      color: #c4a87a;
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s, transform 0.15s, color 0.2s;
    }
    .dado-btn:hover {
      background: rgba(212,175,55,0.12);
      border-color: #d4af37;
      color: #d4af37;
      transform: translateY(-2px);
    }
    .dado-btn[aria-pressed="true"] {
      background: rgba(139,0,0,0.3);
      border-color: #d4af37;
      color: #d4af37;
      box-shadow: 0 0 10px rgba(212,175,55,0.25);
    }
    .dado-svg {
      width: 34px;
      height: 34px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linejoin: round;
      transition: filter 0.2s;
    }
    .dado-btn[aria-pressed="true"] .dado-svg {
      filter: drop-shadow(0 0 4px #d4af37);
    }
 
    /* ── Quantidade ── */
    .dados-quantidade {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px 12px;
      font-size: 0.85rem;
      color: #c4a87a;
    }
    .qtd-controle {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .qtd-controle button {
      width: 28px;
      height: 28px;
      background: #3d2b1f;
      border: 1px solid #8b4513;
      color: #d4af37;
      border-radius: 4px;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
      transition: background 0.2s;
    }
    .qtd-controle button:hover { background: #5d3a1a; }
    #qtd-dados {
      width: 52px;
      text-align: center;
      background: #1a1008;
      border: 1px solid #8b4513;
      color: #e0d1b0;
      border-radius: 4px;
      padding: 4px;
      font-family: 'Georgia', serif;
      font-size: 0.9rem;
    }
    #qtd-dados:focus { outline: none; border-color: #d4af37; }
 
    /* ── Botão rolar ── */
    .btn-rolar {
      display: block;
      width: calc(100% - 28px);
      margin: 0 14px 14px;
      padding: 12px;
      background: linear-gradient(to bottom, #8b0000, #5a0000);
      border: 1px solid #d4af37;
      border-radius: 6px;
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
      box-shadow: 0 3px 0 #3a0000;
    }
    .btn-rolar:not(:disabled):hover {
      background: linear-gradient(to bottom, #a00000, #6a0000);
      box-shadow: 0 3px 12px rgba(212,175,55,0.3);
    }
    .btn-rolar:not(:disabled):active {
      transform: translateY(2px);
      box-shadow: 0 1px 0 #3a0000;
    }
    .btn-rolar:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
 
    /* ── Área de resultado ── */
    .resultado-area {
      margin: 0 14px 14px;
      min-height: 80px;
      background: rgba(0,0,0,0.3);
      border: 1px solid #3d2b1f;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .resultado-vazio { color: #5d4a30; font-style: italic; font-size: 0.85rem; }
 
    .resultado-total {
      font-family: 'Cinzel', serif;
      font-size: 2.4rem;
      font-weight: bold;
      color: #d4af37;
      text-shadow: 0 0 12px rgba(212,175,55,0.5);
      line-height: 1.1;
      animation: surgir 0.3s ease;
    }
    .resultado-critico {
      color: #ff4444;
      text-shadow: 0 0 16px rgba(255,68,68,0.7);
      animation: brilhar 0.6s ease-in-out;
    }
    .resultado-fumble {
      color: #888;
      text-shadow: none;
    }
    .resultado-label {
      font-size: 0.75rem;
      color: #8b6914;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .resultado-detalhes {
      margin-top: 6px;
      font-size: 0.78rem;
      color: #c4a87a;
    }
    .resultado-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 10px;
      border-radius: 12px;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge-critico { background: rgba(255,68,68,0.2); color: #ff6666; border: 1px solid #ff4444; }
    .badge-fumble  { background: rgba(100,100,100,0.2); color: #aaa; border: 1px solid #666; }
 
    @keyframes surgir {
      from { transform: scale(0.7); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    @keyframes brilhar {
      0%, 100% { text-shadow: 0 0 12px rgba(255,68,68,0.5); }
      50%       { text-shadow: 0 0 28px rgba(255,68,68,1); }
    }
    .rolando-anim {
      font-family: 'Cinzel', serif;
      font-size: 1.8rem;
      color: #d4af37;
      animation: girar 0.5s linear infinite;
      display: inline-block;
    }
    @keyframes girar {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
 
    /* ── Histórico ── */
    .historico-area {
      border-top: 1px solid #3d2b1f;
      padding: 10px 14px 14px;
    }
    .historico-titulo {
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      color: #8b6914;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .historico-lista {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 130px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #3d2b1f transparent;
    }
    .historico-lista::-webkit-scrollbar { width: 4px; }
    .historico-lista::-webkit-scrollbar-thumb { background: #3d2b1f; border-radius: 2px; }
    .historico-vazio { color: #5d4a30; font-style: italic; font-size: 0.8rem; }
    .historico-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-bottom: 3px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(61,43,31,0.5);
      animation: surgir 0.25s ease;
    }
    .historico-item:hover { background: rgba(212,175,55,0.06); }
    .hist-tipo { color: #8b6914; font-family: 'Cinzel', serif; }
    .hist-resultado { color: #d4af37; font-weight: bold; }
    .hist-critico { color: #ff6666 !important; }
    .hist-fumble  { color: #888 !important; }
 
    .btn-limpar {
      margin-top: 8px;
      width: 100%;
      padding: 5px;
      background: none;
      border: 1px solid #3d2b1f;
      color: #5d4a30;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }
    .btn-limpar:hover { border-color: #8b0000; color: #c4a87a; }
 
    /* ── Responsividade ── */
    @media (max-width: 400px) {
      #painel-dados { width: calc(100vw - 20px); right: 10px; }
    }
  `;
  document.head.appendChild(style);
}
 
// ─── Eventos ─────────────────────────────────────────────────
 
function registrarEventos(botaoFlutuante, painel) {
  // Abrir/fechar painel
  botaoFlutuante.addEventListener('click', () => alternarPainel(painel, botaoFlutuante));
  document.getElementById('btn-fechar-dados').addEventListener('click', () => fecharPainel(painel, botaoFlutuante));
 
  // Selecionar dado
  painel.querySelectorAll('.dado-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarDado(btn, painel));
  });
 
  // Quantidade
  document.getElementById('qtd-menos').addEventListener('click', () => ajustarQuantidade(-1));
  document.getElementById('qtd-mais').addEventListener('click', () => ajustarQuantidade(1));
  document.getElementById('qtd-dados').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) estado.quantidade = Math.min(20, Math.max(1, val));
    atualizarBotaoRolar();
  });
 
  // Rolar
  document.getElementById('btn-rolar').addEventListener('click', rolar);
 
  // Limpar histórico
  document.getElementById('btn-limpar').addEventListener('click', limparHistorico);
 
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (
      painel.classList.contains('visivel') &&
      !painel.contains(e.target) &&
      e.target !== botaoFlutuante
    ) {
      fecharPainel(painel, botaoFlutuante);
    }
  });
 
  // Atalho de teclado: R para rolar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharPainel(painel, botaoFlutuante);
  });
}
 
// ─── Lógica do painel ─────────────────────────────────────────
 
function alternarPainel(painel, botao) {
  const aberto = painel.classList.toggle('visivel');
  painel.setAttribute('aria-hidden', String(!aberto));
  botao.classList.toggle('aberto', aberto);
}
 
function fecharPainel(painel, botao) {
  painel.classList.remove('visivel');
  painel.setAttribute('aria-hidden', 'true');
  botao.classList.remove('aberto');
}
 
function selecionarDado(btn, painel) {
  painel.querySelectorAll('.dado-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  estado.dadoSelecionado = { tipo: btn.dataset.tipo, lados: parseInt(btn.dataset.lados) };
  atualizarBotaoRolar();
}
 
function ajustarQuantidade(delta) {
  const input = document.getElementById('qtd-dados');
  const novoVal = Math.min(20, Math.max(1, estado.quantidade + delta));
  estado.quantidade = novoVal;
  input.value = novoVal;
  atualizarBotaoRolar();
}
 
function atualizarBotaoRolar() {
  const btn = document.getElementById('btn-rolar');
  const texto = document.getElementById('btn-rolar-texto');
  if (estado.dadoSelecionado) {
    btn.disabled = false;
    const q = estado.quantidade;
    texto.textContent = `Rolar ${q > 1 ? q + 'x' : ''} ${estado.dadoSelecionado.tipo}`;
  } else {
    btn.disabled = true;
    texto.textContent = 'Selecione um dado';
  }
}
 
// ─── Lógica de rolagem ───────────────────────────────────────
 
function rolarDado(lados) {
  return Math.floor(Math.random() * lados) + 1;
}
 
function rolar() {
  if (!estado.dadoSelecionado || estado.rolando) return;
  estado.rolando = true;
 
  const { tipo, lados } = estado.dadoSelecionado;
  const qtd = estado.quantidade;
  const areaResultado = document.getElementById('resultado-area');
 
  // Animação enquanto rola
  areaResultado.innerHTML = `<div class="rolando-anim">🎲</div>`;
 
  setTimeout(() => {
    const resultados = Array.from({ length: qtd }, () => rolarDado(lados));
    const total = resultados.reduce((a, b) => a + b, 0);
 
    // Crítico e fumble valem só p/ 1d20
    const isCritico = tipo === 'd20' && qtd === 1 && total === 20;
    const isFumble  = tipo === 'd20' && qtd === 1 && total === 1;
 
    exibirResultado(areaResultado, { tipo, lados, qtd, resultados, total, isCritico, isFumble });
    adicionarHistorico({ tipo, qtd, resultados, total, isCritico, isFumble });
 
    estado.rolando = false;
  }, 450);
}
 
function exibirResultado(area, { tipo, qtd, resultados, total, isCritico, isFumble }) {
  let classeTotal = 'resultado-total';
  if (isCritico) classeTotal += ' resultado-critico';
  if (isFumble)  classeTotal += ' resultado-fumble';
 
  const label = qtd > 1
    ? `${qtd}× ${tipo} — Total`
    : tipo;
 
  const detalhes = qtd > 1
    ? `<div class="resultado-detalhes">[${resultados.join(', ')}]</div>`
    : '';
 
  let badge = '';
  if (isCritico) badge = `<div><span class="resultado-badge badge-critico">⚔️ Crítico!</span></div>`;
  if (isFumble)  badge = `<div><span class="resultado-badge badge-fumble">💀 Fumble!</span></div>`;
 
  area.innerHTML = `
    <div class="resultado-label">${label}</div>
    <div class="${classeTotal}">${total}</div>
    ${detalhes}
    ${badge}
  `;
}
 
// ─── Histórico ───────────────────────────────────────────────
 
function adicionarHistorico({ tipo, qtd, resultados, total, isCritico, isFumble }) {
  const entrada = { tipo, qtd, resultados, total, isCritico, isFumble, ts: Date.now() };
  estado.historico.unshift(entrada);
  if (estado.historico.length > MAX_HISTORICO) estado.historico.pop();
  renderizarHistorico();
}
 
function renderizarHistorico() {
  const lista = document.getElementById('historico-lista');
  if (estado.historico.length === 0) {
    lista.innerHTML = '<li class="historico-vazio">Nenhuma rolagem ainda.</li>';
    return;
  }
 
  lista.innerHTML = estado.historico.map(e => {
    const classeRes = e.isCritico ? 'hist-resultado hist-critico' : e.isFumble ? 'hist-resultado hist-fumble' : 'hist-resultado';
    const prefixo = e.qtd > 1 ? `${e.qtd}×` : '';
    const badge = e.isCritico ? ' ⚔️' : e.isFumble ? ' 💀' : '';
    const detalhe = e.qtd > 1 ? ` [${e.resultados.join(',')}]` : '';
    return `
      <li class="historico-item">
        <span class="hist-tipo">${prefixo}${e.tipo}</span>
        <span class="${classeRes}">${e.total}${badge}${detalhe}</span>
      </li>
    `;
  }).join('');
}
 
function limparHistorico() {
  estado.historico = [];
  renderizarHistorico();
}
 
// ─── Init ─────────────────────────────────────────────────────
 
document.addEventListener('DOMContentLoaded', criarWidget);
 