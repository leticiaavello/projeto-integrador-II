import { useState, useEffect, useCallback, useRef } from 'react';
import Button from 'react-bootstrap/Button';
const AUTH_STORAGE_KEY = 'gestao-escolar-user';
const PAGE_STORAGE_KEY = 'gestao-escolar-page';
const VALID_AUTHENTICATED_PAGES = [
  'dashboard',
  'reserva',
  'minhas-reservas',
  'consultar',
  'coord-reservas',
  'agenda',
  'coord-bloquear',
  'coord-relatorios',
  'sec-equipamentos',
  'sec-salas',
  'sec-labs',
  'sec-patrimonio',
];

function readSavedUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const validRoles = ['professor', 'coordenacao', 'secretaria'];
    if (
      saved &&
      typeof saved === 'object' &&
      typeof saved.name === 'string' &&
      validRoles.includes(saved.role)
    ) {
      return saved;
    }
    return null;
  } catch {
    return null;
  }
}

function readSavedPage() {
  const savedUser = readSavedUser();
  if (!savedUser) return 'home';
  try {
    const savedPage = window.localStorage.getItem(PAGE_STORAGE_KEY);
    return VALID_AUTHENTICATED_PAGES.includes(savedPage)
      ? savedPage
      : 'dashboard';
  } catch {
    return 'dashboard';
  }
}

// --- Data ---
const slides = [
    {
        id: 1,
        img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&h=900&fit=crop&auto=format',
        heading: 'Gestão Escolar Integrada',
        sub: 'Organize, reserve e acompanhe os ambientes e equipamentos da escola em um só lugar.',
    },
    {
        id: 2,
        img: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&h=900&fit=crop&auto=format',
        heading: 'Laboratórios e Salas Especiais',
        sub: 'Consulte disponibilidade em tempo real e garanta o espaço certo para sua aula.',
    },
    {
        id: 3,
        img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&h=900&fit=crop&auto=format',
        heading: 'Controle de Equipamentos',
        sub: 'Acompanhe ocorrências, manutenções e o histórico completo de cada recurso.',
    },
];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORARIOS = [
    '07h00-08h00', '08h00-09h00', '09h00-10h00', '10h00-11h00',
    '11h00-12h00', '13h00-14h00', '14h00-15h00', '15h00-16h00', '16h00-17h00',
];
const SALAS = ['Sala 01', 'Sala 02', 'Sala 03', 'Sala 04', 'Sala 05', 'Auditório', 'Quadra Poliesportiva'];
const LABS = ['Laboratório de Informática', 'Laboratório de Ciências', 'Laboratório de Química', 'Laboratório de Física'];
const mockReservas = [
    { id: 1, recurso: 'Sala 01', data: '2026-10-02', horario: '08h00-09h00', finalidade: 'Aula de Matemática', status: 'ativa', usuario: 'Maria Silva' },
    { id: 2, recurso: 'Laboratório de Informática', data: '2026-10-03', horario: '10h00-11h00', finalidade: 'Aula de TI', status: 'ativa', usuario: 'Maria Silva' },
    { id: 3, recurso: 'Sala 03', data: '2026-10-05', horario: '13h00-14h00', finalidade: 'Reunião pedagógica', status: 'ativa', usuario: 'João Souza' },
    { id: 4, recurso: 'Auditório', data: '2026-10-07', horario: '14h00-15h00', finalidade: 'Evento cultural', status: 'ativa', usuario: 'Ana Lima' },
];
const mockEquipamentos = [];
const mockEspacos = [
    { id: 1, tipo: 'Sala', nome: 'Sala 03', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 2, tipo: 'Sala', nome: 'Sala 04', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 3, tipo: 'Sala', nome: 'Sala 05', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 4, tipo: 'Sala', nome: 'Sala 06', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 5, tipo: 'Sala', nome: 'Sala 07', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 6, tipo: 'Sala', nome: 'Sala 08', localizacao: '1º Andar', bloco: 'Bloco A', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 7, tipo: 'Sala', nome: 'Sala 10', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV Philco', situacao: 'Disponível' },
    { id: 8, tipo: 'Sala', nome: 'Sala 11', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV Samsung', situacao: 'Disponível' },
    { id: 9, tipo: 'Sala', nome: 'Sala 12', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 10, tipo: 'Sala', nome: 'Sala 13', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV Samsung', situacao: 'Disponível' },
    { id: 11, tipo: 'Sala', nome: 'Sala 14', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 12, tipo: 'Sala', nome: 'Sala 15', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV LG/TCL', situacao: 'Disponível' },
    { id: 13, tipo: 'Sala', nome: 'Sala 16', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 14, tipo: 'Sala', nome: 'Sala 17', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV LG', situacao: 'Disponível' },
    { id: 15, tipo: 'Sala', nome: 'Sala 18', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV Philco', situacao: 'Disponível' },
    { id: 16, tipo: 'Sala', nome: 'Sala 19', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV Philco', situacao: 'Disponível' },
    { id: 17, tipo: 'Sala', nome: 'Sala 20', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV Philco', situacao: 'Disponível' },
    { id: 18, tipo: 'Sala', nome: 'Sala 21', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV Samsung', situacao: 'Disponível' },
    { id: 19, tipo: 'Sala', nome: 'Sala 22', localizacao: '2º Andar', bloco: 'Bloco C', capacidade: '35', descricao: 'Quadro branco, Smart TV Samsung', situacao: 'Disponível' },
    { id: 20, tipo: 'Sala', nome: 'Sala ADM', localizacao: 'Térreo', bloco: 'Administrativo', capacidade: '20', descricao: 'Sala administrativa, 40 Chromebooks Samsung', situacao: 'Disponível' },
    { id: 21, tipo: 'Laboratório', nome: 'Sala de Informática', localizacao: 'Térreo', bloco: 'Bloco A', capacidade: '30', descricao: '15 Chromebooks XE310XDA + 8 Notebooks Positivo 2025, Smart TV Multilaser, internet Wi-Fi', situacao: 'Disponível' },
    { id: 22, tipo: 'Sala', nome: 'Sala de Música', localizacao: '1º Andar', bloco: 'Bloco B', capacidade: '30', descricao: 'Projetor Betec, equipamentos musicais', situacao: 'Disponível' },
    { id: 23, tipo: 'Sala', nome: 'Sala do Diretor', localizacao: 'Térreo', bloco: 'Administrativo', capacidade: '10', descricao: 'Projetor LG, Projetor Epson', situacao: 'Disponível' },
    { id: 24, tipo: 'Lab. Móvel', nome: 'Plataforma de Recarga 1', localizacao: 'Térreo', bloco: 'Depósito', capacidade: '30', descricao: 'Patrimônio 195588 — carregamento de tablets e notebooks', situacao: 'Disponível' },
    { id: 25, tipo: 'Lab. Móvel', nome: 'Plataforma de Recarga 2', localizacao: 'Térreo', bloco: 'Depósito', capacidade: '30', descricao: 'Patrimônio 223411 — carregamento de tablets e notebooks', situacao: 'Disponível' },
    { id: 26, tipo: 'Lab. Móvel', nome: 'Plataforma de Recarga 3', localizacao: 'Térreo', bloco: 'Depósito', capacidade: '30', descricao: 'Patrimônio 223412', situacao: 'Disponível' },
    { id: 27, tipo: 'Lab. Móvel', nome: 'Plataforma de Recarga 4', localizacao: 'PROATI', bloco: 'PROATI', capacidade: '30', descricao: 'Patrimônio 223413', situacao: 'Disponível' },
];
// 9 aulas + 1 intervalo. Cada dia da semana (1=Seg…5=Sex) define onde ficam Tutoria e ATPCG.
const PERIODOS_BASE = [
    [1, '07h00–07h50'],
    [2, '07h50–08h40'],
    [3, '08h40–09h30'],
    [0, '09h30–09h50'], // Intervalo
    [4, '09h50–10h40'],
    [5, '10h40–11h30'],
    [6, '11h30–12h20'],
    [7, '12h20–13h10'],
    [8, '13h10–14h00'],
    [9, '14h00–14h50'],
];
const especiais = {
    1: { 2: 'ATPCG', 3: 'ATPCG' }, // Segunda: ATPCG nas 2ª e 3ª
    2: { 5: 'Tutoria' }, // Terça: Tutoria na 5ª
    3: { 5: 'Tutoria' }, // Quarta: Tutoria na 5ª
    4: { 5: 'Tutoria', 6: 'Tutoria' }, // Quinta: Tutoria nas 5ª e 6ª
    5: { 6: 'Tutoria' }, // Sexta: Tutoria na 6ª
};
function gradeParaDia(diaSemana) {
    const esp = especiais[diaSemana] ?? {};
    return PERIODOS_BASE.map(([p, h]) => ({
        periodo: p,
        horario: h,
        tipo: p === 0 ? 'Intervalo' : (esp[p] ?? 'Aula'),
    }));
}
// --- Shared UI Helpers & Styles ---
const btn = (extra = {}) => ({
    fontFamily: 'var(--font-body)',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    padding: '10px 22px',
    transition: 'background 0.2s',
    ...extra,
});
const field = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid var(--border)',
    borderRadius: '2px',
    background: 'var(--secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--foreground)',
    outline: 'none',
    boxSizing: 'border-box',
};
const label = {
    display: 'block',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)',
    marginBottom: '6px',
};
const card = (color) => ({
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '2rem 1.5rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
});
const selectStyle = {
    ...field,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6560' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
};
const SituacaoBadge = ({ s }) => {
    const colors = {
        'Disponível': '#2e7d5e',
        'Em manutenção': '#c4843a',
        'Indisponível': '#c0392b',
        'Fora de uso': '#555',
    };
    return (<span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
            background: (colors[s] || '#999') + '22', color: colors[s] || '#999',
            border: `1px solid ${colors[s] || '#999'}44`,
        }}>
      {s}
    </span>);
};
const Breadcrumb = ({ label: lbl, onBack }) => (<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
    <Button variant="link" className="app-rb-button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>
      Dashboard
    </Button>
    <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>›</span>
    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{lbl}</span>
  </div>);
const Calendar = ({ calYear, setCalYear, calMonth, setCalMonth, selectedDay, setSelectedDay, onContinue, onVerAgenda }) => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const isPast = (d) => new Date(calYear, calMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const empties = Array.from({ length: firstDay }, () => null);
    const numbered = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const cells = [...empties, ...numbered];
    return (<div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <Button variant="link" className="app-rb-button" onClick={() => { setCalMonth(m => m === 0 ? 11 : m - 1); if (calMonth === 0)
        setCalYear(y => y - 1); setSelectedDay(null); }} style={{ ...btn(), background: 'none', color: 'var(--foreground)', fontSize: '1.3rem', padding: '4px 10px' }}>‹</Button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{MONTHS[calMonth]} {calYear}</span>
        <Button variant="link" className="app-rb-button" onClick={() => { setCalMonth(m => m === 11 ? 0 : m + 1); if (calMonth === 11)
        setCalYear(y => y + 1); setSelectedDay(null); }} style={{ ...btn(), background: 'none', color: 'var(--foreground)', fontSize: '1.3rem', padding: '4px 10px' }}>›</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
        {WEEK.map(d => <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0.75rem', gap: '4px' }}>
        {cells.map((d, i) => {
            if (!d)
                return <div key={`e-${i}`}/>;
            const past = isPast(d);
            const sel = selectedDay === d;
            const tod = isToday(d);
            return (<Button variant="link" className="app-rb-button" key={d} disabled={past} onClick={() => setSelectedDay(d)} style={{ padding: '10px 4px', border: sel ? '2px solid var(--primary)' : tod ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '2px', background: sel ? 'var(--primary)' : 'none', color: sel ? '#fff' : past ? 'var(--muted-foreground)' : 'var(--foreground)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: tod || sel ? 700 : 400, cursor: past ? 'not-allowed' : 'pointer', opacity: past ? 0.35 : 1, transition: 'background 0.15s', textAlign: 'center' }} onMouseEnter={e => { if (!past && !sel)
                e.currentTarget.style.background = 'var(--secondary)'; }} onMouseLeave={e => { if (!sel)
                e.currentTarget.style.background = 'none'; }}>{d}</Button>);
        })}
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[{ color: 'var(--accent)', label: 'Hoje' }, { color: 'var(--primary)', label: 'Selecionado' }].map(({ color, label: l }) => (<span key={l} style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: l === 'Selecionado' ? color : 'none', border: l === 'Hoje' ? `2px solid ${color}` : 'none', borderRadius: '2px', display: 'inline-block' }}/>{l}
            </span>))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedDay && onVerAgenda && (<Button variant="link" className="app-rb-button" onClick={() => {
                const dataStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                onVerAgenda(dataStr);
            }} style={{ ...btn({ background: 'none', color: 'var(--accent)', border: '2px solid var(--accent)', padding: '9px 18px' }) }}>
              📅 Ver grade do dia
            </Button>)}
          <Button variant="link" className="app-rb-button" disabled={!selectedDay} onClick={onContinue} style={{ ...btn({ background: selectedDay ? 'var(--primary)' : 'var(--muted)', color: '#fff', opacity: selectedDay ? 1 : 0.5, cursor: selectedDay ? 'pointer' : 'not-allowed' }) }}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>);
};
const RECURSOS_POR_TIPO = {
    'Lab. Móvel': ['Plataforma de Recarga 1', 'Plataforma de Recarga 2', 'Plataforma de Recarga 3', 'Plataforma de Recarga 4'],
    'Sala': SALAS,
    'Laboratório': LABS,
    'Equipamento': ['Projetor', 'Webcam', 'Caixa de Som', 'Microfone', 'Smart TV', 'Nobreak'],
};
const corTipoAula = {
    Aula: { bg: '#f0f4f8', border: '#c8c2b8', text: '#1a1a2e' },
    Tutoria: { bg: '#fff7ed', border: '#c4843a', text: '#92510a' },
    ATPCG: { bg: '#f0f4ff', border: '#4e72b8', text: '#2a4a90' },
    Intervalo: { bg: '#f5f4f1', border: '#e8e4dc', text: '#6b6560' },
};
const PageReserva = ({ reservaStep, setReservaStep, reservaLocal, setReservaLocal, reservaFinalidade, setReservaFinalidade, calYear, setCalYear, calMonth, setCalMonth, selectedDay, setSelectedDay, setReservas, backToDash, user }) => {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formTipo, setFormTipo] = useState('Lab. Móvel');
    const [reservaTurma, setReservaTurma] = useState('');
    const [confirmedSlot, setConfirmedSlot] = useState(null);
    const diaSemana = selectedDay ? new Date(calYear, calMonth, selectedDay).getDay() : 1;
    const grade = gradeParaDia(diaSemana);
    const handleConfirmar = () => {
        if (!selectedSlot || !reservaLocal)
            return;
        const novaReserva = {
            id: Date.now(),
            recurso: reservaLocal,
            data: `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
            horario: selectedSlot.horario,
            finalidade: reservaFinalidade || 'Reserva',
            turma: reservaTurma || undefined,
            status: 'ativa',
            usuario: user?.name || '',
        };
        setConfirmedSlot(selectedSlot);
        setReservas(rs => [...rs, novaReserva]);
        setReservaStep('success');
    };
    const nomeDia = selectedDay
        ? `${WEEK[diaSemana]}, ${selectedDay} de ${MONTHS[calMonth]} de ${calYear}`
        : '';
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Breadcrumb label="Solicitar Reserva" onBack={backToDash}/>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Solicitar Reserva</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '2rem' }}>RF03-RF08 · Selecione a data e a aula desejada.</p>

        {reservaStep === 'success' ? (<div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2e7d5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reserva Confirmada!</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}><strong>{reservaLocal}</strong> · {nomeDia}</p>
            {reservaTurma && <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Turma: <strong>{reservaTurma}</strong></p>}
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
              {confirmedSlot ? `${confirmedSlot.periodo}ª aula · ${confirmedSlot.horario}` : ''}
            </p>
            <Button variant="link" className="app-rb-button" onClick={backToDash} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }}>
              Voltar ao Dashboard
            </Button>
          </div>) : reservaStep === 'grade' ? (<>
            {/* Cabeçalho do dia */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>{WEEK[diaSemana]}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{selectedDay} de {MONTHS[calMonth]} de {calYear}</p>
              </div>
              <Button variant="link" className="app-rb-button" onClick={() => { setReservaStep('calendar'); setSelectedSlot(null); }} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)', padding: '8px 16px' }) }}>
                ← Alterar data
              </Button>
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['Aula', 'Tutoria', 'ATPCG', 'Intervalo'].map(t => (<span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: corTipoAula[t].text }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: corTipoAula[t].bg, border: `2px solid ${corTipoAula[t].border}`, display: 'inline-block' }}/>
                  {t}
                </span>))}
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Clique em uma aula para reservar</span>
            </div>

            {/* Grade */}
            <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'grid', gridTemplateColumns: '52px 130px 1fr', background: 'var(--foreground)', color: 'var(--background)', padding: '10px 18px', gap: '12px' }}>
                {['Aula', 'Horário', 'Atividade / Reserva'].map(h => (<span key={h} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</span>))}
              </div>

              {grade.map((slot, idx) => {
                const c = corTipoAula[slot.tipo];
                const isIntervalo = slot.tipo === 'Intervalo';
                const isSelected = selectedSlot?.periodo === slot.periodo && slot.periodo !== 0;
                const clickable = !isIntervalo;
                return (<div key={idx} style={{ borderTop: idx > 0 ? `1px solid ${c.border}44` : undefined }}>
                    {/* Linha principal */}
                    <div onClick={() => clickable && setSelectedSlot(isSelected ? null : slot)} style={{
                        display: 'grid', gridTemplateColumns: '52px 130px 1fr', gap: '12px',
                        padding: isIntervalo ? '6px 18px' : '13px 18px',
                        background: isSelected ? 'var(--primary)' : c.bg,
                        cursor: clickable ? 'pointer' : 'default',
                        alignItems: 'center',
                        transition: 'background 0.15s',
                    }} onMouseEnter={e => { if (clickable && !isSelected)
                    e.currentTarget.style.background = isSelected ? 'var(--primary)' : '#e8edf4'; }} onMouseLeave={e => { if (clickable && !isSelected)
                    e.currentTarget.style.background = c.bg; }}>
                      {/* Nº aula */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {isIntervalo ? (<span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.08em' }}>—</span>) : (<span style={{
                            width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSelected ? '#fff' : (slot.tipo !== 'Aula' ? c.border : 'var(--foreground)'),
                            color: isSelected ? 'var(--primary)' : '#fff',
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem',
                        }}>
                            {slot.periodo}
                          </span>)}
                      </div>

                      {/* Horário */}
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: isSelected ? '#fff' : c.text }}>
                        {slot.horario}
                      </span>

                      {/* Tipo / badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: isIntervalo ? '0.7rem' : '0.8rem', color: isSelected ? '#ffffff99' : (isIntervalo ? 'var(--muted-foreground)' : c.text), fontStyle: isIntervalo ? 'italic' : undefined }}>
                          {isIntervalo ? 'Intervalo' : slot.tipo === 'Aula' ? 'Aula regular' : slot.tipo}
                        </span>
                        {clickable && !isSelected && (<span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', opacity: 0.6 }}>
                            + Reservar
                          </span>)}
                        {isSelected && (<span style={{ fontSize: '0.65rem', color: '#ffffffaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>▲ Fechar</span>)}
                      </div>
                    </div>

                    {/* Formulário embutido */}
                    {isSelected && (<div style={{ background: 'var(--background)', border: '2px solid var(--primary)', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '1.5rem 1.5rem 1.25rem' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1.25rem' }}>
                          {slot.periodo}ª Aula · {slot.horario}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={label}>Tipo de Recurso</label>
                            <select style={selectStyle} value={formTipo} onChange={e => { setFormTipo(e.target.value); setReservaLocal(''); }}>
                              <option value="Lab. Móvel">Laboratório Móvel de Informática</option>
                              <option value="Sala">Sala</option>
                              <option value="Laboratório">Laboratório</option>
                              <option value="Equipamento">Equipamento</option>
                            </select>
                          </div>
                          <div>
                            <label style={label}>Recurso</label>
                            <select style={selectStyle} value={reservaLocal} onChange={e => setReservaLocal(e.target.value)}>
                              <option value="">Selecione...</option>
                              {(RECURSOS_POR_TIPO[formTipo] || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <label style={label}>Turma</label>
                          <input style={field} placeholder="Ex: 1ºB, 2ºA, 3ºC..." value={reservaTurma} onChange={e => setReservaTurma(e.target.value)}/>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={label}>Finalidade da Reserva</label>
                          <textarea rows={2} placeholder="Descreva o objetivo da reserva..." style={{ ...field, resize: 'vertical' }} value={reservaFinalidade} onChange={e => setReservaFinalidade(e.target.value)}/>
                        </div>

                        <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '1rem', padding: '7px 12px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--accent)' }}>
                          RF07-RF08: A disponibilidade será verificada antes de confirmar.
                        </p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Button variant="link" className="app-rb-button" onClick={() => setSelectedSlot(null)} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)', flex: '1' }) }}>
                            Cancelar
                          </Button>
                          <Button variant="link" className="app-rb-button" disabled={!reservaLocal} onClick={handleConfirmar} style={{ ...btn({ background: reservaLocal ? 'var(--primary)' : 'var(--muted)', color: '#fff', flex: '2', opacity: reservaLocal ? 1 : 0.5, cursor: reservaLocal ? 'pointer' : 'not-allowed' }) }}>
                            Confirmar Reserva
                          </Button>
                        </div>
                      </div>)}
                  </div>);
            })}
            </div>
          </>) : (<Calendar calYear={calYear} setCalYear={setCalYear} calMonth={calMonth} setCalMonth={setCalMonth} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onContinue={() => { setSelectedSlot(null); setReservaStep('grade'); }}/>)}
      </div>
    </main>);
};
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const PageAgenda = ({ data, reservas, onBack }) => {
    const dt = data ? new Date(data + 'T12:00:00') : new Date();
    const diaSemana = dt.getDay(); // 0=Dom…6=Sab
    const grade = gradeParaDia(diaSemana);
    const reservasDoDia = reservas.filter(r => r.data === data && r.status === 'ativa');
    const corTipo = {
        Aula: { bg: '#f0f4f8', border: 'var(--border)', text: 'var(--foreground)', label: 'Aula Regular' },
        Tutoria: { bg: '#fff7ed', border: '#c4843a', text: '#92510a', label: 'Tutoria' },
        ATPCG: { bg: '#f0f4ff', border: '#4e72b8', text: '#2a4a90', label: 'ATPCG' },
        Intervalo: { bg: 'var(--secondary)', border: 'var(--border)', text: 'var(--muted-foreground)', label: 'Intervalo' },
    };
    const labelPeriodo = (p) => p === 0 ? '' : `${p}ª`;
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Breadcrumb label="Grade do Dia" onBack={onBack}/>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>
            {DIAS_SEMANA[diaSemana]}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.1 }}>
            {dt.getDate()} de {MESES[dt.getMonth()]} de {dt.getFullYear()}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            Visualização das 9 aulas · E.E. Washington Luiz
          </p>
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {['Aula', 'Tutoria', 'ATPCG', 'Intervalo'].map(t => (<span key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: corTipo[t].text }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: corTipo[t].bg, border: `2px solid ${corTipo[t].border}`, display: 'inline-block', flexShrink: 0 }}/>
              {corTipo[t].label}
            </span>))}
        </div>

        {/* Grade de aulas */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '2rem' }}>
          {/* Cabeçalho da grade */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 140px 1fr', background: 'var(--foreground)', color: 'var(--background)', padding: '10px 20px', gap: '12px' }}>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Aula</span>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Horário</span>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Atividade</span>
          </div>

          {grade.map((slot, idx) => {
            const c = corTipo[slot.tipo];
            const isIntervalo = slot.tipo === 'Intervalo';
            // reservas neste horário
            const resNaAula = reservasDoDia.filter(r => slot.periodo > 0 && r.horario.startsWith(slot.horario.slice(0, 5)));
            return (<div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 140px 1fr',
                    gap: '12px',
                    padding: isIntervalo ? '7px 20px' : '14px 20px',
                    background: c.bg,
                    borderTop: idx > 0 ? `1px solid ${c.border}44` : undefined,
                    alignItems: 'center',
                }}>
                {/* Nº período */}
                <div style={{ textAlign: 'center' }}>
                  {isIntervalo ? (<span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>—</span>) : (<span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: slot.tipo !== 'Aula' ? c.border : 'var(--foreground)',
                        color: '#fff',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {slot.periodo}
                    </span>)}
                </div>

                {/* Horário */}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: isIntervalo ? 'var(--muted-foreground)' : c.text, fontFamily: 'var(--font-body)' }}>
                  {slot.horario}
                </span>

                {/* Tipo + reservas */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {slot.tipo !== 'Aula' && slot.tipo !== 'Intervalo' && (<span style={{
                        background: c.border, color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                        borderRadius: '2px', padding: '2px 8px',
                    }}>
                        {slot.tipo}
                      </span>)}
                    {isIntervalo && (<span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Intervalo</span>)}
                    {slot.tipo === 'Aula' && (<span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Aula regular</span>)}
                  </div>
                  {resNaAula.length > 0 && (<div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {resNaAula.map(r => (<span key={r.id} style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            background: 'var(--accent)', color: '#fff',
                            borderRadius: '2px', padding: '2px 8px', width: 'fit-content',
                        }}>
                          📌 {r.recurso} — {r.finalidade || 'Reserva'}
                        </span>))}
                    </div>)}
                </div>
              </div>);
        })}
        </div>

        {/* Painel de reservas do dia */}
        {reservasDoDia.length > 0 && (<div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '6px', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Reservas neste dia ({reservasDoDia.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reservasDoDia.map(r => (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--secondary)', borderRadius: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>{r.recurso}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.horario} · {r.finalidade}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2e7d5e', background: '#2e7d5e22', border: '1.5px solid #2e7d5e44', borderRadius: '2px', padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ativa</span>
                </div>))}
            </div>
          </div>)}

        {reservasDoDia.length === 0 && (<p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>Nenhuma reserva registrada para este dia.</p>)}
      </div>
    </main>);
};
const PageMinhasReservas = ({ reservas, user, cancelReserva, backToDash, onVerAgenda }) => {
    const [filterSituacao, setFilterSituacao] = useState('todas');
    const [filterDataIni, setFilterDataIni] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '';
    const activeFilters = [filterSituacao !== 'todas' ? filterSituacao : '', filterDataIni, filterDataFim, filterPeriodo].filter(Boolean).length;
    const clearAll = () => { setFilterSituacao('todas'); setFilterDataIni(''); setFilterDataFim(''); setFilterPeriodo(''); };
    const minhas = reservas.filter(r => r.usuario === user?.name);
    const filtered = minhas.filter(r => {
        if (filterSituacao !== 'todas' && r.status !== filterSituacao)
            return false;
        if (filterDataIni && r.data < filterDataIni)
            return false;
        if (filterDataFim && r.data > filterDataFim)
            return false;
        if (filterPeriodo && !r.horario.startsWith(filterPeriodo))
            return false;
        return true;
    });
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Breadcrumb label="Minhas Reservas" onBack={backToDash}/>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Minhas Reservas</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>RF09-RF10 · Consulte e cancele suas reservas.</p>

        {/* Painel de filtros */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Filtros {activeFilters > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.65rem', marginLeft: '6px' }}>{activeFilters}</span>}
            </span>
            {activeFilters > 0 && (<Button variant="link" className="app-rb-button" onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>
                Limpar filtros
              </Button>)}
          </div>

          {/* Situação — segmentado */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={label}>Situação</label>
            <div style={{ display: 'flex', gap: '0', border: '2px solid var(--border)', borderRadius: '2px', overflow: 'hidden', width: 'fit-content' }}>
              {[['todas', 'Todas'], ['ativa', 'Ativas'], ['cancelada', 'Canceladas']].map(([val, lbl]) => (<Button variant="link" className="app-rb-button" key={val} onClick={() => setFilterSituacao(val)} style={{ padding: '7px 18px', background: filterSituacao === val ? 'var(--foreground)' : 'var(--background)', color: filterSituacao === val ? 'var(--background)' : 'var(--foreground)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer', transition: 'background 0.15s, color 0.15s', borderRight: val !== 'cancelada' ? '1px solid var(--border)' : 'none' }}>
                  {lbl}
                </Button>))}
            </div>
          </div>

          {/* Data e Período */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={label}>Data inicial</label>
              <input type="date" style={field} value={filterDataIni} onChange={e => setFilterDataIni(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Data final</label>
              <input type="date" style={field} value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Período / Horário</label>
              <select style={selectStyle} value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}>
                <option value="">Todos</option>
                <optgroup label="Manhã">
                  {HORARIOS.filter(h => parseInt(h) < 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
                <optgroup label="Tarde">
                  {HORARIOS.filter(h => parseInt(h) >= 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          {filterDataIni && filterDataFim && (<p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '6px 10px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--border)' }}>
              Período: {fmtData(filterDataIni)} → {fmtData(filterDataFim)}
            </p>)}
        </div>

        {/* Contador */}
        <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
          {filtered.length} de {minhas.length} reserva{minhas.length !== 1 ? 's' : ''}
          {activeFilters > 0 ? ` (${activeFilters} filtro${activeFilters > 1 ? 's' : ''} ativo${activeFilters > 1 ? 's' : ''})` : ''}
        </p>

        {filtered.length === 0 ? (<div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>{minhas.length === 0 ? 'Você ainda não possui reservas.' : 'Nenhuma reserva corresponde aos filtros aplicados.'}</p>
          </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(r => (<div key={r.id} style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', opacity: r.status === 'cancelada' ? 0.5 : 1 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{r.recurso}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                    <Button variant="link" className="app-rb-button" onClick={() => onVerAgenda(r.data)} title="Ver grade do dia" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.8rem', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}>
                      📅 {fmtData(r.data)}
                    </Button>
                    {' · '}{r.horario}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{r.finalidade}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <SituacaoBadge s={r.status === 'cancelada' ? 'Indisponível' : 'Disponível'}/>
                  {r.status === 'ativa' && <Button variant="link" className="app-rb-button" onClick={() => cancelReserva(r.id)} style={{ ...btn({ background: '#c0392b', color: '#fff', padding: '8px 16px' }) }}>Cancelar</Button>}
                </div>
              </div>))}
          </div>)}
      </div>
    </main>);
};
const PageConsultar = ({ equipamentos, bloqueios, reservas, backToDash }) => {
    const [tipo, setTipo] = useState('salas');
    const [filterData, setFilterData] = useState('');
    const [filterNome, setFilterNome] = useState('');
    const bloqueados = bloqueios.map(b => b.recurso);
    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '';
    const activeFilters = [filterData, filterNome].filter(Boolean).length;
    const clearAll = () => { setFilterData(''); setFilterNome(''); };
    const baseList = tipo === 'salas' ? SALAS : tipo === 'labs' ? LABS : equipamentos.map(e => e.tipo + ' — ' + (e.patrimonio || e.simplificado || String(e.id)));
    const lista = baseList.filter(item => !filterNome || item.toLowerCase().includes(filterNome.toLowerCase()));
    // For equip mode, keep a parallel array with ids so keys are unique
    const equipFiltered = tipo === 'equip'
        ? equipamentos.filter(e => !filterNome || (e.tipo + ' — ' + (e.patrimonio || e.simplificado || String(e.id))).toLowerCase().includes(filterNome.toLowerCase()))
        : [];
    const colors = { 'Disponível': '#2e7d5e', 'Reservado': '#c4843a', 'Bloqueado': '#c0392b' };
    const getStatus = (item) => {
        const nome = tipo === 'equip' ? item.split(' — ')[1] : item;
        const bloqueado = bloqueados.some(b => nome === b || item.includes(b));
        if (bloqueado)
            return 'Bloqueado';
        if (filterData) {
            const ocupado = reservas.some(r => r.status === 'ativa' && r.recurso === item && r.data === filterData);
            return ocupado ? 'Reservado' : 'Disponível';
        }
        const reservado = reservas.some(r => r.status === 'ativa' && r.recurso === item);
        return reservado ? 'Reservado' : 'Disponível';
    };
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Breadcrumb label="Consultar Disponibilidade" onBack={backToDash}/>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Consultar Disponibilidade</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>RF02, RF39 · Disponibilidade atualizada em tempo real.</p>

        {/* Tipo de recurso — segmentado */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={label}>Tipo de recurso</p>
          <div style={{ display: 'flex', gap: '0', border: '2px solid var(--foreground)', borderRadius: '2px', overflow: 'hidden', width: 'fit-content' }}>
            {[['salas', '🏫 Salas'], ['labs', '🔬 Laboratórios'], ['equip', '💻 Equipamentos']].map(([val, lbl]) => (<Button variant="link" className="app-rb-button" key={val} onClick={() => { setTipo(val); setFilterNome(''); }} style={{ padding: '9px 20px', background: tipo === val ? 'var(--foreground)' : 'var(--background)', color: tipo === val ? 'var(--background)' : 'var(--foreground)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer', transition: 'background 0.15s, color 0.15s', borderRight: val !== 'equip' ? '1px solid var(--border)' : 'none' }}>
                {lbl}
              </Button>))}
          </div>
        </div>

        {/* Filtros de data e nome */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Filtros {activeFilters > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.65rem', marginLeft: '6px' }}>{activeFilters}</span>}
            </span>
            {activeFilters > 0 && (<Button variant="link" className="app-rb-button" onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>
                Limpar filtros
              </Button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={label}>
                {filterData ? `Disponibilidade em ${fmtData(filterData)}` : 'Data (disponibilidade no dia)'}
              </label>
              <input type="date" style={field} value={filterData} onChange={e => setFilterData(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Buscar por nome</label>
              <input style={field} placeholder={tipo === 'salas' ? 'Ex: Sala 01, Auditório...' : tipo === 'labs' ? 'Ex: Informática, Ciências...' : 'Ex: NB-01, Projetor...'} value={filterNome} onChange={e => setFilterNome(e.target.value)}/>
            </div>
          </div>
          {filterData && (<p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '6px 10px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--accent)' }}>
              Mostrando disponibilidade para <strong>{fmtData(filterData)}</strong>. Sem data selecionada, exibe o estado atual.
            </p>)}
        </div>

        {/* Contador */}
        <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
          {lista.length} {tipo === 'salas' ? 'sala' : tipo === 'labs' ? 'laboratório' : 'equipamento'}{lista.length !== 1 ? 's' : ''} encontrado{lista.length !== 1 ? 's' : ''}
        </p>

        {/* Cards de resultado */}
        {lista.length === 0 ? (<p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '3rem' }}>Nenhum recurso encontrado.</p>) : tipo === 'equip' ? (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {equipFiltered.map(e => {
                const label = e.tipo + ' — ' + (e.patrimonio || e.simplificado || String(e.id));
                const status = getStatus(label);
                return (<div key={e.id} style={{ background: 'var(--background)', border: `2px solid ${colors[status]}44`, borderRadius: '4px', padding: '1rem 1.25rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{e.tipo}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '6px' }}>{e.patrimonio || e.simplificado} · {e.local}</p>
                  <SituacaoBadge s={e.situacao === 'Disponível' ? 'Disponível' : e.situacao === 'Em manutenção' ? 'Reservado' : 'Bloqueado'}/>
                  {filterData && e.situacao === 'Disponível' && (<p style={{ fontSize: '0.7rem', color: '#2e7d5e', marginTop: '6px', fontWeight: 500 }}>Livre em {fmtData(filterData)}</p>)}
                </div>);
            })}
          </div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {lista.map(item => {
                const status = getStatus(item);
                return (<div key={item} style={{ background: 'var(--background)', border: `2px solid ${colors[status]}44`, borderRadius: '4px', padding: '1rem 1.25rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>{item}</p>
                  <SituacaoBadge s={status}/>
                  {filterData && status === 'Disponível' && (<p style={{ fontSize: '0.7rem', color: '#2e7d5e', marginTop: '6px', fontWeight: 500 }}>Livre em {fmtData(filterData)}</p>)}
                </div>);
            })}
          </div>)}

        {/* Legenda */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[['Disponível', '#2e7d5e'], ['Reservado', '#c4843a'], ['Bloqueado', '#c0392b']].map(([s, c]) => (<span key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: c + '33', border: `2px solid ${c}88`, display: 'inline-block' }}/>{s}
            </span>))}
        </div>
      </div>
    </main>);
};
const PageCoordReservas = ({ reservas, filterRecurso, setFilterRecurso, filterUsuario, setFilterUsuario, cancelReserva, backToDash, onSolicitarReserva, onVerAgenda }) => {
    const [filterDataIni, setFilterDataIni] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const activeFilters = [filterRecurso, filterUsuario, filterDataIni, filterDataFim, filterPeriodo].filter(Boolean).length;
    const clearAll = () => {
        setFilterRecurso('');
        setFilterUsuario('');
        setFilterDataIni('');
        setFilterDataFim('');
        setFilterPeriodo('');
    };
    const filtered = reservas.filter(r => {
        if (filterRecurso && !r.recurso.toLowerCase().includes(filterRecurso.toLowerCase()))
            return false;
        if (filterUsuario && !r.usuario.toLowerCase().includes(filterUsuario.toLowerCase()))
            return false;
        if (filterDataIni && r.data < filterDataIni)
            return false;
        if (filterDataFim && r.data > filterDataFim)
            return false;
        if (filterPeriodo && !r.horario.startsWith(filterPeriodo))
            return false;
        return true;
    });
    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '';
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Breadcrumb label="Todas as Reservas" onBack={backToDash}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Gerenciar Reservas</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>RF11-RF13, RF18-RF19 · Visualize, filtre e gerencie todas as reservas.</p>
          </div>
          <Button variant="link" className="app-rb-button" onClick={onSolicitarReserva} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
            📅 Solicitar Reserva
          </Button>
        </div>

        {/* Painel de filtros */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Filtros {activeFilters > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.65rem', marginLeft: '6px' }}>{activeFilters}</span>}
            </span>
            {activeFilters > 0 && (<Button variant="link" className="app-rb-button" onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>
                Limpar filtros
              </Button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={label}>Recurso</label>
              <input style={field} placeholder="Ex: Sala 01, Auditório..." value={filterRecurso} onChange={e => setFilterRecurso(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Professor / Usuário</label>
              <input style={field} placeholder="Nome do professor" value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={label}>Data inicial</label>
              <input type="date" style={field} value={filterDataIni} onChange={e => setFilterDataIni(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Data final</label>
              <input type="date" style={field} value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Período / Horário</label>
              <select style={selectStyle} value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}>
                <option value="">Todos</option>
                <optgroup label="Manhã">
                  {HORARIOS.filter(h => parseInt(h) < 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
                <optgroup label="Tarde">
                  {HORARIOS.filter(h => parseInt(h) >= 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          {filterDataIni && filterDataFim && (<p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '6px 10px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--border)' }}>
              Período: {fmtData(filterDataIni)} → {fmtData(filterDataFim)}
            </p>)}
        </div>

        {/* Contador de resultados */}
        <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
          {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          {activeFilters > 0 ? ` com ${activeFilters} filtro${activeFilters > 1 ? 's' : ''} ativo${activeFilters > 1 ? 's' : ''}` : ''}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(r => (<div key={r.id} style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', opacity: r.status === 'cancelada' ? 0.5 : 1 }}>
              <div>
                <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '2px' }}>{r.recurso}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                  <Button variant="link" className="app-rb-button" onClick={() => onVerAgenda(r.data)} title="Ver grade do dia" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.78rem', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}>
                    📅 {fmtData(r.data)}
                  </Button>
                  {' · '}{r.horario}{' · '}<em>{r.usuario}</em>
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{r.finalidade}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <SituacaoBadge s={r.status === 'cancelada' ? 'Indisponível' : 'Disponível'}/>
                {r.status === 'ativa' && <Button variant="link" className="app-rb-button" onClick={() => cancelReserva(r.id)} style={{ ...btn({ background: '#c0392b', color: '#fff', padding: '7px 14px' }) }}>Cancelar</Button>}
              </div>
            </div>))}
          {filtered.length === 0 && <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>Nenhuma reserva encontrada com os filtros aplicados.</p>}
        </div>
      </div>
    </main>);
};
const PERIODOS_LABEL = {
    1: '1ª aula (07h00–07h50)', 2: '2ª aula (07h50–08h40)', 3: '3ª aula (08h40–09h30)',
    4: '4ª aula (09h50–10h40)', 5: '5ª aula (10h40–11h30)', 6: '6ª aula (11h30–12h20)',
    7: '7ª aula (12h20–13h10)', 8: '8ª aula (13h10–14h00)', 9: '9ª aula (14h00–14h50)',
};
const PageCoordBloquear = ({ bloqueios, setBloqueios, backToDash }) => {
    const [tipo, setTipo] = useState('Sala');
    const [recurso, setRecurso] = useState('');
    const [motivo, setMotivo] = useState('');
    const [data, setData] = useState('');
    const [aula, setAula] = useState('');
    const recursoOpts = tipo === 'Sala' ? SALAS : tipo === 'Laboratório' ? LABS
        : tipo === 'Lab. Móvel' ? ['Plataforma de Recarga 1', 'Plataforma de Recarga 2', 'Plataforma de Recarga 3', 'Plataforma de Recarga 4']
            : HORARIOS;
    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '';
    const handleAplicar = () => {
        if (!recurso)
            return;
        setBloqueios(b => [...b, { id: Date.now(), tipo, recurso, motivo, data: data || undefined, aula: aula || undefined }]);
        setRecurso('');
        setMotivo('');
        setData('');
        setAula('');
    };
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Breadcrumb label="Bloquear Recursos" onBack={backToDash}/>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Bloquear Recursos</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '2rem' }}>RF14-RF17 · Bloqueie e desbloqueie horários, salas, laboratórios e equipamentos.</p>

        {/* Formulário */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Novo Bloqueio</h2>

          {/* Tipo + Recurso */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={label}>Tipo</label>
              <select style={selectStyle} value={tipo} onChange={e => { setTipo(e.target.value); setRecurso(''); }}>
                {['Sala', 'Laboratório', 'Lab. Móvel', 'Equipamento'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Recurso</label>
              <select style={selectStyle} value={recurso} onChange={e => setRecurso(e.target.value)}>
                <option value="">Selecione...</option>
                {recursoOpts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Data + Aula */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={label}>Data do bloqueio</label>
              <input type="date" style={field} value={data} onChange={e => setData(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Horário / Aula</label>
              <select style={selectStyle} value={aula} onChange={e => setAula(e.target.value)}>
                <option value="">Dia inteiro</option>
                {Object.entries(PERIODOS_LABEL).map(([p, lbl]) => (<option key={p} value={lbl}>{lbl}</option>))}
              </select>
            </div>
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label}>Motivo</label>
            <input style={field} placeholder="Ex: Reforma elétrica, evento externo..." value={motivo} onChange={e => setMotivo(e.target.value)}/>
          </div>

          {!data && (<p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginBottom: '1rem', padding: '7px 12px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--border)' }}>
              Sem data selecionada, o bloqueio é permanente até ser removido.
            </p>)}

          <Button variant="link" className="app-rb-button" onClick={handleAplicar} disabled={!recurso} style={{ ...btn({ background: recurso ? 'var(--primary)' : 'var(--muted)', color: '#fff', opacity: recurso ? 1 : 0.5, cursor: recurso ? 'pointer' : 'not-allowed' }) }}>
            Aplicar Bloqueio
          </Button>
        </div>

        {/* Lista de bloqueios */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Bloqueios Ativos</h2>
        {bloqueios.length === 0 ? (<p style={{ color: 'var(--muted-foreground)' }}>Nenhum bloqueio ativo.</p>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bloqueios.map(b => (<div key={b.id} style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '3px' }}>
                    {b.recurso}
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontWeight: 400, marginLeft: '8px' }}>({b.tipo})</span>
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '2px' }}>
                    {b.data ? `📅 ${fmtData(b.data)}` : '📅 Permanente'}
                    {b.aula ? ` · 🕐 ${b.aula}` : ' · Dia inteiro'}
                  </p>
                  {b.motivo && <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{b.motivo}</p>}
                </div>
                <Button variant="link" className="app-rb-button" onClick={() => setBloqueios(bs => bs.filter(x => x.id !== b.id))} style={{ ...btn({ background: '#2e7d5e', color: '#fff', padding: '7px 14px' }) }}>
                  Desbloquear
                </Button>
              </div>))}
          </div>)}
      </div>
    </main>);
};
const PageRelatorios = ({ reservas, bloqueios, backToDash }) => {
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterDataIni, setFilterDataIni] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [gerado, setGerado] = useState(false);
    const [exportMsg, setExportMsg] = useState('');
    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '';
    const activeFilters = [filterTipo !== 'todos' ? filterTipo : '', filterDataIni, filterDataFim, filterPeriodo].filter(Boolean).length;
    const clearAll = () => { setFilterTipo('todos'); setFilterDataIni(''); setFilterDataFim(''); setFilterPeriodo(''); setGerado(false); };
    const tipoDoRecurso = (recurso) => {
        if (LABS.some(l => recurso.includes(l) || l.includes(recurso)))
            return 'Laboratório';
        if (SALAS.some(s => recurso.includes(s) || s.includes(recurso)))
            return 'Sala';
        return 'Equipamento';
    };
    const filtered = reservas.filter(r => {
        if (filterTipo !== 'todos' && tipoDoRecurso(r.recurso) !== filterTipo)
            return false;
        if (filterDataIni && r.data < filterDataIni)
            return false;
        if (filterDataFim && r.data > filterDataFim)
            return false;
        if (filterPeriodo && !r.horario.startsWith(filterPeriodo))
            return false;
        return true;
    });
    const ativas = filtered.filter(r => r.status === 'ativa');
    const canceladas = filtered.filter(r => r.status === 'cancelada');
    const porRecurso = {};
    ativas.forEach(r => { porRecurso[r.recurso] = (porRecurso[r.recurso] || 0) + 1; });
    const max = Math.max(...Object.values(porRecurso), 1);
    const handleExportar = (formato) => {
        if (formato === 'CSV') {
            const linhas = ['Recurso,Data,Horário,Finalidade,Usuário,Status', ...filtered.map(r => `"${r.recurso}","${r.data}","${r.horario}","${r.finalidade}","${r.usuario}","${r.status}"`)];
            const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'relatorio_reservas.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
        setExportMsg(`${formato} gerado com ${filtered.length} registro${filtered.length !== 1 ? 's' : ''}.`);
        setTimeout(() => setExportMsg(''), 3000);
    };
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Breadcrumb label="Relatórios de Utilização" onBack={backToDash}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Relatórios de Utilização</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>RF21 · Histórico e estatísticas de uso dos recursos.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="link" className="app-rb-button" onClick={() => setGerado(true)} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
              ⚙ Gerar Relatório
            </Button>
            <div style={{ position: 'relative' }}>
              <Button variant="link" className="app-rb-button" onClick={() => handleExportar('CSV')} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--secondary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                ↓ Exportar CSV
              </Button>
            </div>
            <Button variant="link" className="app-rb-button" onClick={() => handleExportar('PDF')} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              ↓ Exportar PDF
            </Button>
          </div>
        </div>

        {exportMsg && (<div style={{ marginBottom: '1rem', padding: '10px 16px', background: '#2e7d5e18', border: '1.5px solid #2e7d5e55', borderRadius: '3px', fontSize: '0.82rem', color: '#2e7d5e', fontWeight: 500 }}>
            ✓ {exportMsg}
          </div>)}

        {/* Filtros */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              Filtros {activeFilters > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.65rem', marginLeft: '6px' }}>{activeFilters}</span>}
            </span>
            {activeFilters > 0 && (<Button variant="link" className="app-rb-button" onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>
                Limpar filtros
              </Button>)}
          </div>

          {/* Tipo — segmentado */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={label}>Tipo de recurso</label>
            <div style={{ display: 'flex', gap: '0', border: '2px solid var(--border)', borderRadius: '2px', overflow: 'hidden', width: 'fit-content' }}>
              {[['todos', 'Todos'], ['Sala', '🏫 Salas'], ['Laboratório', '🔬 Laboratórios'], ['Equipamento', '💻 Equipamentos']].map(([val, lbl]) => (<Button variant="link" className="app-rb-button" key={val} onClick={() => { setFilterTipo(val); setGerado(false); }} style={{ padding: '7px 16px', background: filterTipo === val ? 'var(--foreground)' : 'var(--background)', color: filterTipo === val ? 'var(--background)' : 'var(--foreground)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', transition: 'background 0.15s, color 0.15s', borderRight: val !== 'Equipamento' ? '1px solid var(--border)' : 'none' }}>
                  {lbl}
                </Button>))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={label}>Data inicial</label>
              <input type="date" style={field} value={filterDataIni} onChange={e => { setFilterDataIni(e.target.value); setGerado(false); }}/>
            </div>
            <div>
              <label style={label}>Data final</label>
              <input type="date" style={field} value={filterDataFim} onChange={e => { setFilterDataFim(e.target.value); setGerado(false); }}/>
            </div>
            <div>
              <label style={label}>Período / Horário</label>
              <select style={selectStyle} value={filterPeriodo} onChange={e => { setFilterPeriodo(e.target.value); setGerado(false); }}>
                <option value="">Todos</option>
                <optgroup label="Manhã">
                  {HORARIOS.filter(h => parseInt(h) < 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
                <optgroup label="Tarde">
                  {HORARIOS.filter(h => parseInt(h) >= 12).map(h => <option key={h} value={h}>{h}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          {filterDataIni && filterDataFim && (<p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '6px 10px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid var(--border)' }}>
              Período: {fmtData(filterDataIni)} → {fmtData(filterDataFim)}
            </p>)}
        </div>

        {/* Cards de totais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '1.75rem' }}>
          {[
            { l: 'Reservas Ativas', v: ativas.length, color: 'var(--primary)' },
            { l: 'Cancelamentos', v: canceladas.length, color: '#c0392b' },
            { l: 'Recursos Bloqueados', v: bloqueios.length, color: '#c4843a' },
            { l: 'Total no Período', v: filtered.length, color: '#6b3fa0' },
        ].map(({ l, v, color }) => (<div key={l} style={{ background: 'var(--background)', border: `2px solid ${color}33`, borderRadius: '4px', padding: '1.1rem 1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '6px', lineHeight: 1.4 }}>{l}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, color }}>{v}</p>
            </div>))}
        </div>

        {/* Gráfico de barras por recurso */}
        {(gerado || Object.keys(porRecurso).length > 0) && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                Uso por Recurso {filterTipo !== 'todos' && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>— {filterTipo}s</span>}
              </h2>
              {gerado && filterDataIni && filterDataFim && (<span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{fmtData(filterDataIni)} → {fmtData(filterDataFim)}</span>)}
            </div>
            <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
              {Object.keys(porRecurso).length === 0 ? (<p style={{ color: 'var(--muted-foreground)', textAlign: 'center', fontSize: '0.85rem' }}>Nenhuma reserva ativa com os filtros aplicados.</p>) : Object.entries(porRecurso).sort((a, b) => b[1] - a[1]).map(([recurso, count]) => {
                const t = tipoDoRecurso(recurso);
                const barColor = t === 'Laboratório' ? '#2e7d5e' : t === 'Equipamento' ? '#6b3fa0' : 'var(--primary)';
                return (<div key={recurso}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: barColor + '22', color: barColor, fontWeight: 600, border: `1px solid ${barColor}44` }}>{t}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{recurso}</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{count} reserva{count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: barColor, borderRadius: '5px', transition: 'width 0.6s ease' }}/>
                    </div>
                  </div>);
            })}
            </div>
          </>)}

        {/* Tabela de registros — só aparece após Gerar */}
        {gerado && (<>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Registros ({filtered.length})</h2>
            <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', padding: '10px 1.25rem', borderBottom: '2px solid var(--border)', background: 'var(--secondary)' }}>
                {['Recurso', 'Data', 'Horário', 'Usuário', 'Status'].map(h => (<span key={h} style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{h}</span>))}
              </div>
              {filtered.length === 0 ? (<p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Nenhum registro encontrado.</p>) : filtered.map((r, i) => (<div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', opacity: r.status === 'cancelada' ? 0.55 : 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.recurso}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{fmtData(r.data)}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{r.horario}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{r.usuario}</span>
                  <SituacaoBadge s={r.status === 'cancelada' ? 'Indisponível' : 'Disponível'}/>
                </div>))}
            </div>
          </>)}
      </div>
    </main>);
};
const PageEquipamentos = ({ equipamentos, setEquipamentos, eqFilter, setEqFilter, backToDash }) => {
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [importMsg, setImportMsg] = useState('');
    const [exportMsg, setExportMsg] = useState('');
    const importRef = useRef(null);
    const emptyForm = { patrimonio: '', simplificado: '', tipo: '', marca: '', modelo: '', local: '', situacao: 'Disponível', descricao: '' };
    const [form, setForm] = useState(emptyForm);
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const filtered = equipamentos.filter(e => !eqFilter || [e.patrimonio, e.simplificado, e.tipo, e.local, e.situacao, e.marca, e.modelo].some(v => v.toLowerCase().includes(eqFilter.toLowerCase())));
    const updateSituacao = (id, sit) => setEquipamentos(eq => eq.map(e => e.id === id ? { ...e, situacao: sit } : e));
    const handleSave = () => {
        if (!form.patrimonio && !form.simplificado)
            return;
        setEquipamentos(eq => [...eq, { ...form, id: Date.now() }]);
        setForm(emptyForm);
    };
    const handleExportar = () => {
        const cabecalho = 'Nº Patrimônio,Nº Simplificado,Tipo,Marca,Modelo,Localização,Situação,Descrição';
        const linhas = equipamentos.map(e => `"${e.patrimonio}","${e.simplificado}","${e.tipo}","${e.marca}","${e.modelo}","${e.local}","${e.situacao}","${e.descricao || ''}"`);
        const blob = new Blob([[cabecalho, ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'equipamentos.csv';
        a.click();
        URL.revokeObjectURL(url);
        setExportMsg(`${equipamentos.length} equipamento${equipamentos.length !== 1 ? 's' : ''} exportado${equipamentos.length !== 1 ? 's' : ''}.`);
        setTimeout(() => setExportMsg(''), 3000);
    };
    const handleImportar = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            const linhas = text.split('\n').slice(1).filter(l => l.trim());
            const novos = [];
            linhas.forEach(linha => {
                const cols = linha.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                if (cols.length >= 6) {
                    novos.push({
                        id: Date.now() + Math.random(),
                        patrimonio: cols[0] || '', simplificado: cols[1] || '',
                        tipo: cols[2] || '', marca: cols[3] || '',
                        modelo: cols[4] || '', local: cols[5] || '',
                        situacao: cols[6] || 'Disponível', descricao: cols[7] || '',
                    });
                }
            });
            if (novos.length > 0) {
                setEquipamentos(eq => [...eq, ...novos]);
                setImportMsg(`${novos.length} equipamento${novos.length !== 1 ? 's' : ''} importado${novos.length !== 1 ? 's' : ''} com sucesso.`);
            }
            else {
                setImportMsg('Nenhum registro válido encontrado no arquivo.');
            }
            setTimeout(() => setImportMsg(''), 4000);
        };
        reader.readAsText(file);
        if (importRef.current)
            importRef.current.value = '';
    };
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <Breadcrumb label="Equipamentos e Patrimônio" onBack={backToDash}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Equipamentos e Patrimônio</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>RF24-RF37 · Patrimônio, tipo, localização, situação e manutenção.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="link" className="app-rb-button" onClick={handleExportar} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              ↓ Exportar CSV
            </Button>
            <Button variant="link" className="app-rb-button" onClick={() => importRef.current?.click()} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              ↑ Importar CSV
            </Button>
            <input ref={importRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleImportar}/>
            {!showForm && (<Button variant="link" className="app-rb-button" onClick={() => setShowForm(true)} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
                + Novo Equipamento
              </Button>)}
          </div>
        </div>

        {/* Feedback de importação / exportação */}
        {importMsg && (<div style={{ marginBottom: '1rem', padding: '10px 16px', background: importMsg.includes('Nenhum') ? '#c0392b18' : '#2e7d5e18', border: `1.5px solid ${importMsg.includes('Nenhum') ? '#c0392b55' : '#2e7d5e55'}`, borderRadius: '3px', fontSize: '0.82rem', color: importMsg.includes('Nenhum') ? '#c0392b' : '#2e7d5e', fontWeight: 500 }}>
            {importMsg.includes('Nenhum') ? '✕' : '✓'} {importMsg}
          </div>)}
        {exportMsg && (<div style={{ marginBottom: '1rem', padding: '10px 16px', background: '#2e7d5e18', border: '1.5px solid #2e7d5e55', borderRadius: '3px', fontSize: '0.82rem', color: '#2e7d5e', fontWeight: 500 }}>
            ✓ {exportMsg}
          </div>)}

        {/* Dica de formato de importação */}
        {!showForm && (<div style={{ marginBottom: '1.25rem', padding: '8px 14px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '3px', fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>ℹ️</span>
            Formato CSV esperado: <code style={{ fontFamily: 'monospace', background: 'var(--secondary)', padding: '1px 6px', borderRadius: '2px' }}>Patrimônio, Simplificado, Tipo, Marca, Modelo, Localização, Situação, Descrição</code>
          </div>)}
        {showForm && (<div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>🖥️ Novo Equipamento</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div><label style={label}>Nº de Patrimônio (RF25)</label><input style={field} placeholder="Ex: 0012349" value={form.patrimonio} onChange={e => setF('patrimonio', e.target.value)}/></div>
              <div><label style={label}>Nº Simplificado (RF26)</label><input style={field} placeholder="Ex: NB-05" value={form.simplificado} onChange={e => setF('simplificado', e.target.value)}/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div><label style={label}>Tipo (RF27)</label>
                <select style={selectStyle} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                  <option value="">Selecione...</option>
                  {['Notebook', 'Computador', 'Projetor', 'TV', 'Tablet', 'Roteador', 'Câmera', 'Impressora', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={label}>Marca</label><input style={field} placeholder="Ex: Acer" value={form.marca} onChange={e => setF('marca', e.target.value)}/></div>
              <div><label style={label}>Modelo</label><input style={field} placeholder="Ex: Aspire 5" value={form.modelo} onChange={e => setF('modelo', e.target.value)}/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div><label style={label}>Localização (RF27)</label><input style={field} placeholder="Ex: Sala 01, Lab Informática..." value={form.local} onChange={e => setF('local', e.target.value)}/></div>
              <div><label style={label}>Situação (RF30)</label>
                <select style={selectStyle} value={form.situacao} onChange={e => setF('situacao', e.target.value)}>
                  {['Disponível', 'Em manutenção', 'Indisponível', 'Fora de uso'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}><label style={label}>Descrição / Observações</label><textarea rows={2} placeholder="Ex: Carregador incluso, tela trincada..." style={{ ...field, resize: 'vertical' }} value={form.descricao} onChange={e => setF('descricao', e.target.value)}/></div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="link" className="app-rb-button" onClick={() => { setShowForm(false); setForm(emptyForm); }} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }}>Cancelar</Button>
              <Button variant="link" className="app-rb-button" onClick={handleSave} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>Salvar Equipamento</Button>
            </div>
          </div>)}
        <div style={{ marginBottom: '1.25rem' }}><label style={label}>Pesquisar (RF29)</label><input style={field} placeholder="Patrimônio, simplificado, tipo, local, situação..." value={eqFilter} onChange={e => setEqFilter(e.target.value)}/></div>
        {filtered.length === 0 && <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '3rem' }}>Nenhum equipamento encontrado.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(eq => (<div key={eq.id} style={{ background: 'var(--background)', border: `2px solid ${eq.situacao === 'Indisponível' || eq.situacao === 'Fora de uso' ? '#c0392b44' : eq.situacao === 'Em manutenção' ? '#c4843a44' : 'var(--border)'}`, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="link" className="app-rb-button" onClick={() => setExpandedId(expandedId === eq.id ? null : eq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--muted-foreground)', padding: 0, lineHeight: 1, flexShrink: 0 }}>
                  {expandedId === eq.id ? '▾' : '▸'}
                </Button>
                <div style={{ flex: '1 1 160px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>{eq.tipo} — <span style={{ fontFamily: 'monospace' }}>{eq.simplificado}</span></p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{eq.marca} {eq.modelo} · {eq.local}</p>
                </div>
                <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--muted-foreground)', flex: '0 0 auto' }}>Patr. {eq.patrimonio}</p>
                <SituacaoBadge s={eq.situacao}/>
                <select value={eq.situacao} onChange={ev => updateSituacao(eq.id, ev.target.value)} style={{ ...selectStyle, fontSize: '0.75rem', padding: '5px 28px 5px 8px', width: 'auto', flexShrink: 0 }}>
                  {['Disponível', 'Em manutenção', 'Indisponível', 'Fora de uso'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {expandedId === eq.id && (<div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  {[{ label: 'Nº Patrimônio', value: eq.patrimonio }, { label: 'Nº Simplificado', value: eq.simplificado }, { label: 'Tipo', value: eq.tipo }, { label: 'Marca', value: eq.marca }, { label: 'Modelo', value: eq.modelo }, { label: 'Localização', value: eq.local }].map(({ label: l, value }) => (<div key={l}><p style={{ fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '3px' }}>{l}</p><p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{value || '—'}</p></div>))}
                  {eq.descricao && <div style={{ gridColumn: '1/-1' }}><p style={{ fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '3px' }}>Descrição / Observações</p><p style={{ fontSize: '0.85rem' }}>{eq.descricao}</p></div>}
                </div>)}
            </div>))}
        </div>
      </div>
    </main>);
};
const PageCadastroEspaco = ({ tipoProp, espacos, setEspacos, setBloqueios, backToDash }) => {
    const [tipoAtivo, setTipoAtivo] = useState(tipoProp);
    const tipo = tipoAtivo;
    const lista = espacos.filter(e => e.tipo === tipo);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [form, setForm] = useState({ tipo, nome: '', localizacao: '', bloco: '', capacidade: '', descricao: '' });
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleBloqueio = (e) => {
        const bloqueado = e.situacao === 'Indisponível';
        setEspacos(es => es.map(x => x.id === e.id ? { ...x, situacao: bloqueado ? 'Disponível' : 'Indisponível' } : x));
        if (bloqueado)
            setBloqueios(bs => bs.filter(b => b.recurso !== e.nome));
        else
            setBloqueios(bs => [...bs, { id: Date.now(), tipo, recurso: e.nome, motivo: 'Manutenção/Indisponibilidade' }]);
    };
    const handleSave = () => {
        if (!form.nome)
            return;
        setEspacos(es => [...es, { ...form, tipo, id: Date.now(), situacao: 'Disponível' }]);
        setForm({ tipo, nome: '', localizacao: '', bloco: '', capacidade: '', descricao: '' });
        setShowForm(false);
    };
    const tabLabel = (t) => t === 'Sala' ? '🏫 Salas' : t === 'Laboratório' ? '🔬 Laboratórios' : '🔋 Labs Móveis';
    const nomePlaceholder = tipo === 'Sala' ? 'Ex: Sala 06' : tipo === 'Laboratório' ? 'Ex: Lab de Robótica' : 'Ex: Plataforma 01';
    const capLabel = tipo === 'Lab. Móvel' ? 'Nº de Dispositivos' : 'Capacidade (pessoas)';
    const capPlaceholder = tipo === 'Lab. Móvel' ? 'Ex: 30 notebooks' : 'Ex: 35';
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Breadcrumb label="Salas e Laboratórios" onBack={backToDash}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Salas e Laboratórios</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>RF22-RF23, RF34-RF35 · Gerencie os espaços cadastrados.</p>
          </div>
          <Button variant="link" className="app-rb-button" onClick={() => setShowForm(s => !s)} style={{ ...btn({ background: showForm ? 'var(--muted)' : 'var(--primary)', color: '#fff' }) }}>
            {showForm ? '✕ Cancelar' : `+ Novo ${tipo === 'Lab. Móvel' ? 'Lab. Móvel' : tipo}`}
          </Button>
        </div>

        {/* Abas de tipo */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '2px solid var(--foreground)', borderRadius: '2px', overflow: 'hidden', width: 'fit-content' }}>
          {['Sala', 'Laboratório', 'Lab. Móvel'].map((t, i, arr) => (<Button variant="link" className="app-rb-button" key={t} onClick={() => { setTipoAtivo(t); setShowForm(false); setExpandedId(null); setForm({ tipo: t, nome: '', localizacao: '', bloco: '', capacidade: '', descricao: '' }); }} style={{ padding: '9px 22px', background: tipoAtivo === t ? 'var(--foreground)' : 'var(--background)', color: tipoAtivo === t ? 'var(--background)' : 'var(--foreground)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s, color 0.2s', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {tabLabel(t)}
            </Button>))}
        </div>

        {/* Banner informativo para Lab. Móvel */}
        {tipo === 'Lab. Móvel' && !showForm && (<div style={{ marginBottom: '1.25rem', padding: '12px 16px', background: '#6b3fa018', border: '1.5px solid #6b3fa055', borderRadius: '3px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🔋</span>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b3fa0', marginBottom: '2px' }}>Laboratórios Móveis de Informática</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>Plataformas de recarga com notebooks/tablets que se deslocam até as salas. Cadastre cada plataforma com nome, número de dispositivos, localização de guarda e situação.</p>
            </div>
          </div>)}

        {showForm && (<div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {tipo === 'Lab. Móvel' ? '🔋 Nova Plataforma de Recarga' : 'Novo Cadastro'}
            </h2>
            <div style={{ marginBottom: '1rem' }}><label style={label}>Tipo</label>
              <select style={selectStyle} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                <option value="Sala">Sala</option>
                <option value="Laboratório">Laboratório</option>
                <option value="Lab. Móvel">Laboratório Móvel de Informática</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div><label style={label}>Nome / Número</label><input style={field} placeholder={nomePlaceholder} value={form.nome} onChange={e => setF('nome', e.target.value)}/></div>
              <div><label style={label}>{capLabel}</label><input style={field} placeholder={capPlaceholder} value={form.capacidade} onChange={e => setF('capacidade', e.target.value)}/></div>
            </div>
            {tipo === 'Lab. Móvel' && (<div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'var(--secondary)', borderRadius: '2px', borderLeft: '3px solid #6b3fa0' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  <strong>Localização</strong> = onde a plataforma fica guardada quando não está em uso.<br />
                  <strong>Bloco</strong> = identificação da sala ou depósito de guarda.
                </p>
              </div>)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div><label style={label}>{tipo === 'Lab. Móvel' ? 'Localização de Guarda' : 'Localização'}</label>
                <select style={selectStyle} value={form.localizacao} onChange={e => setF('localizacao', e.target.value)}>
                  <option value="">Selecione...</option>
                  {['Térreo', '1º Andar', '2º Andar', '3º Andar', 'Subsolo', 'Depósito', 'Externo'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div><label style={label}>{tipo === 'Lab. Móvel' ? 'Sala / Depósito de Guarda' : 'Bloco / Andar'}</label>
                <input style={field} placeholder={tipo === 'Lab. Móvel' ? 'Ex: Depósito TI' : 'Ex: Bloco A'} value={form.bloco} onChange={e => setF('bloco', e.target.value)}/>
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>{tipo === 'Lab. Móvel' ? 'Dispositivos / Recursos da Plataforma' : 'Descrição / Recursos Disponíveis'}</label>
              <textarea rows={3} placeholder={tipo === 'Lab. Móvel' ? 'Ex: 30 notebooks Dell, carregador embutido, roteador Wi-Fi, cadeado...' : 'Ex: Projetor, quadro branco, ar-condicionado, 30 carteiras...'} style={{ ...field, resize: 'vertical' }} value={form.descricao} onChange={e => setF('descricao', e.target.value)}/>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="link" className="app-rb-button" onClick={() => setShowForm(false)} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }}>Cancelar</Button>
              <Button variant="link" className="app-rb-button" onClick={handleSave} style={{ ...btn({ background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
                Salvar {tipo === 'Lab. Móvel' ? 'Plataforma' : tipo}
              </Button>
            </div>
          </div>)}
        {lista.length === 0 && !showForm && (<p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '3rem' }}>
            {tipo === 'Lab. Móvel' ? 'Nenhuma plataforma de recarga cadastrada.' : `Nenhum(a) ${tipo.toLowerCase()} cadastrado(a).`} Clique no botão acima para começar.
          </p>)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lista.map(espaco => (<div key={espaco.id} style={{ background: 'var(--background)', border: `2px solid ${espaco.situacao === 'Indisponível' ? '#c0392b44' : 'var(--border)'}`, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Button variant="link" className="app-rb-button" onClick={() => setExpandedId(expandedId === espaco.id ? null : espaco.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--muted-foreground)', padding: 0, lineHeight: 1 }}>
                    {expandedId === espaco.id ? '▾' : '▸'}
                  </Button>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{espaco.nome}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{espaco.bloco} · {espaco.localizacao}{espaco.capacidade && ` · ${espaco.capacidade} pessoas`}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SituacaoBadge s={espaco.situacao}/>
                  <Button variant="link" className="app-rb-button" onClick={() => toggleBloqueio(espaco)} style={{ ...btn({ background: espaco.situacao === 'Indisponível' ? '#2e7d5e' : '#c0392b', color: '#fff', padding: '7px 14px' }) }}>
                    {espaco.situacao === 'Indisponível' ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </div>
              </div>
              {expandedId === espaco.id && (<div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  {[{ label: 'Tipo', value: espaco.tipo }, { label: 'Localização', value: espaco.localizacao || '—' }, { label: 'Bloco / Andar', value: espaco.bloco || '—' }, { label: 'Capacidade', value: espaco.capacidade ? `${espaco.capacidade} pessoas` : '—' }].map(({ label: l, value }) => (<div key={l}><p style={{ fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '3px' }}>{l}</p><p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</p></div>))}
                  {espaco.descricao && <div style={{ gridColumn: '1/-1' }}><p style={{ fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '3px' }}>Recursos Disponíveis</p><p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{espaco.descricao}</p></div>}
                </div>)}
            </div>))}
        </div>
      </div>
    </main>);
};
const PagePatrimonio = ({ backToDash, reservas, bloqueios, setBloqueios, equipamentos, espacos }) => {
    const [registros, setRegistros] = useState([
        { id: 1, tipo: 'Equipamento', recurso: 'PR-01', inicio: '2026-09-27', previsao: '2026-10-10', motivo: 'Lâmpada queimada', situacao: 'Em manutenção' },
        { id: 2, tipo: 'Sala', recurso: 'Sala 04', inicio: '2026-09-25', previsao: '2026-10-05', motivo: 'Reforma elétrica', situacao: 'Bloqueada' },
    ]);
    const [showForm, setShowForm] = useState(false);
    const emptyForm = { tipo: 'Equipamento', recurso: '', inicio: '', previsao: '', motivo: '' };
    const [form, setForm] = useState(emptyForm);
    const [notifSent, setNotifSent] = useState(false);
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v, ...(k === 'tipo' ? { recurso: '' } : {}) }));
    const eq = equipamentos || [];
    const esp = espacos || [];
    const recursoOptions = form.tipo === 'Equipamento' ? eq.map(e => e.simplificado || e.patrimonio).filter(Boolean) :
        form.tipo === 'Sala' ? esp.filter(e => e.tipo === 'Sala').map(e => e.nome) :
            form.tipo === 'Laboratório' ? esp.filter(e => e.tipo === 'Laboratório').map(e => e.nome) :
                [];
    const afetadas = reservas.filter(r => r.status === 'ativa' && r.recurso === form.recurso);
    const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '—';
    const fmtRange = (ini, pre) => ini && pre ? `${fmtDate(ini)} – ${fmtDate(pre)}` : ini ? fmtDate(ini) : '—';
    const handleBloquear = () => {
        if (!form.recurso)
            return;
        const novo = {
            id: Date.now(), tipo: form.tipo, recurso: form.recurso,
            inicio: form.inicio || new Date().toISOString().split('T')[0],
            previsao: form.previsao, motivo: form.motivo,
            situacao: 'Em manutenção',
        };
        setRegistros(rs => [novo, ...rs]);
        setBloqueios(bs => [...bs, { id: Date.now(), tipo: form.tipo, recurso: form.recurso, motivo: form.motivo || 'Manutenção' }]);
        setForm(emptyForm);
        setNotifSent(false);
        setShowForm(false);
    };
    const updateSit = (id, sit) => setRegistros(rs => rs.map(r => r.id === id ? { ...r, situacao: sit } : r));
    const desbloquear = (reg) => {
        setRegistros(rs => rs.map(r => r.id === reg.id ? { ...r, situacao: 'Concluída' } : r));
        setBloqueios(bs => bs.filter(b => b.recurso !== reg.recurso));
    };
    const sitColors = {
        'Em manutenção': { bg: '#c4843a22', text: '#c4843a' },
        'Bloqueada': { bg: '#c4843a22', text: '#c4843a' },
        'Concluída': { bg: '#2e7d5e22', text: '#2e7d5e' },
    };
    return (<main style={{ flex: 1, padding: '2.5rem 2rem', background: 'var(--secondary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Breadcrumb label="Manutenção e Indisponibilidade" onBack={backToDash}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Manutenção e Indisponibilidade</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>RF14-RF17, RF31-RF32 · Registre bloqueios, manutenções e acompanhe o histórico.</p>
          </div>
          <Button variant="link" className="app-rb-button" onClick={() => { setShowForm(s => !s); setForm(emptyForm); setNotifSent(false); }} style={{ ...btn({ background: showForm ? 'var(--muted)' : 'var(--primary)', color: '#fff' }) }}>
            {showForm ? '✕ Cancelar' : '+ Registrar Manutenção'}
          </Button>
        </div>

        {/* Formulário de registro — colapsável */}
        {showForm && (<div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Registrar bloqueio / manutenção</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={label}>Tipo</label>
            <select style={selectStyle} value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
              {['Equipamento', 'Sala', 'Laboratório'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={label}>Recurso</label>
            <select style={selectStyle} value={form.recurso} onChange={e => setF('recurso', e.target.value)}>
              <option value="">Selecione...</option>
              {recursoOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
            <div>
              <label style={label}>Início</label>
              <input type="date" style={field} value={form.inicio} onChange={e => setF('inicio', e.target.value)}/>
            </div>
            <div>
              <label style={label}>Previsão de término</label>
              <input type="date" style={field} value={form.previsao} onChange={e => setF('previsao', e.target.value)}/>
            </div>
          </div>
          {form.inicio && form.previsao && (<div style={{ marginBottom: '1rem', padding: '8px 12px', background: 'var(--secondary)', borderRadius: '2px', fontSize: '0.82rem', color: 'var(--muted-foreground)', borderLeft: '3px solid var(--border)' }}>
              {fmtRange(form.inicio, form.previsao)}
            </div>)}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label}>Motivo / descrição</label>
            <input style={field} placeholder="Ex: Lâmpada queimada" value={form.motivo} onChange={e => setF('motivo', e.target.value)}/>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="link" className="app-rb-button" onClick={() => { setShowForm(false); setForm(emptyForm); }} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }}>
              Cancelar
            </Button>
            <Button variant="link" className="app-rb-button" onClick={handleBloquear} disabled={!form.recurso} style={{ ...btn({ background: form.recurso ? 'var(--primary)' : 'var(--muted)', color: '#fff', cursor: form.recurso ? 'pointer' : 'not-allowed' }) }} onMouseEnter={e => { if (form.recurso)
            e.currentTarget.style.background = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.background = form.recurso ? 'var(--primary)' : 'var(--muted)'; }}>
              Bloquear
            </Button>
          </div>
        </div>)}

        {/* Reservas futuras afetadas — visível apenas quando form está aberto e recurso selecionado */}
        {showForm && form.recurso && (<div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Reservas futuras afetadas</h2>
            {afetadas.length > 0 ? (<div style={{ background: '#c4843a18', border: '1.5px solid #c4843a55', borderRadius: '3px', padding: '12px 16px', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.88rem', color: '#a86a24', fontWeight: 500, margin: 0 }}>
                  {afetadas.length} reserva{afetadas.length > 1 ? 's' : ''} ativa{afetadas.length > 1 ? 's' : ''} para <strong>{form.recurso}</strong> serão afetadas.
                </p>
              </div>) : (<div style={{ background: '#2e7d5e18', border: '1.5px solid #2e7d5e55', borderRadius: '3px', padding: '12px 16px', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.88rem', color: '#2e7d5e', fontWeight: 500, margin: 0 }}>Nenhuma reserva ativa para este recurso.</p>
              </div>)}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="link" className="app-rb-button" style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '2px solid var(--border)' }) }}>
                Ver reservas
              </Button>
              <Button variant="link" className="app-rb-button" onClick={() => setNotifSent(true)} style={{ ...btn({ background: notifSent ? '#2e7d5e' : 'none', color: notifSent ? '#fff' : 'var(--foreground)', border: `2px solid ${notifSent ? '#2e7d5e' : 'var(--border)'}` }) }}>
                {notifSent ? '✓ Notificado' : 'Notificar Coordenação'}
              </Button>
            </div>
          </div>)}

        {/* Tabela histórico */}
        <div style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', padding: '10px 1.5rem', borderBottom: '2px solid var(--border)', background: 'var(--secondary)' }}>
            {['Recurso', 'Previsão', 'Situação', 'Ações'].map(h => (<span key={h} style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{h}</span>))}
          </div>
          {registros.length === 0 && (<p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Nenhum registro de manutenção.</p>)}
          {registros.map((reg, i) => {
            const sc = sitColors[reg.situacao] || { bg: '#99999922', text: '#999' };
            return (<div key={reg.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'center', padding: '1rem 1.5rem', gap: '8px', borderBottom: i < registros.length - 1 ? '1px solid var(--border)' : 'none', background: reg.situacao === 'Concluída' ? 'var(--secondary)' : 'var(--background)', opacity: reg.situacao === 'Concluída' ? 0.65 : 1 }}>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '2px' }}>{reg.recurso}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{reg.tipo} · {reg.motivo || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--foreground)' }}>{fmtDate(reg.previsao) || '—'}</p>
                  {reg.inicio && <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Início: {fmtDate(reg.inicio)}</p>}
                </div>
                <div>
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.text}44` }}>
                    {reg.situacao}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  {reg.situacao !== 'Concluída' && (<>
                      <Button variant="link" className="app-rb-button" onClick={() => updateSit(reg.id, reg.situacao === 'Em manutenção' ? 'Bloqueada' : 'Em manutenção')} style={{ ...btn({ background: 'none', color: 'var(--foreground)', border: '1.5px solid var(--border)', padding: '5px 14px', fontSize: '0.72rem' }) }}>
                        Atualizar
                      </Button>
                      <Button variant="link" className="app-rb-button" onClick={() => desbloquear(reg)} style={{ ...btn({ background: '#2e7d5e', color: '#fff', padding: '5px 14px', fontSize: '0.72rem' }) }}>
                        Desbloquear
                      </Button>
                    </>)}
                  {reg.situacao === 'Concluída' && (<span style={{ fontSize: '0.72rem', color: '#2e7d5e', fontWeight: 600 }}>✓ Concluída</span>)}
                </div>
              </div>);
        })}
        </div>

        {/* Linha do tempo de auditoria */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem' }}>Linha do Tempo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { data: '2026-09-28 09:12', usuario: 'Fernanda Costa', acao: 'Equipamento NB-02 marcado como Indisponível' },
            { data: '2026-09-27 14:30', usuario: 'Fernanda Costa', acao: 'Projetor PR-01 enviado para manutenção' },
            { data: '2026-09-25 11:05', usuario: 'Carlos Mendes', acao: 'Sala 04 bloqueada — Reforma elétrica' },
            { data: '2026-09-20 08:00', usuario: 'Fernanda Costa', acao: 'TV-01 cadastrada no patrimônio' },
        ].map((h, i) => (<div key={i} style={{ background: 'var(--background)', border: '2px solid var(--border)', borderRadius: '4px', padding: '1rem 1.5rem', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', marginTop: '5px', flexShrink: 0 }}/>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '2px' }}>{h.acao}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{h.data} · {h.usuario}</p>
              </div>
            </div>))}
        </div>
      </div>
    </main>);
};
// --- Componente Principal ---

export default function App() {
    const [current, setCurrent] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    const [user, setUser] = useState(readSavedUser);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginErro, setLoginErro] = useState('');
const [loginCarregando, setLoginCarregando] = useState(false);

const fazerLogin = async () => {
  setLoginErro('');
  setLoginCarregando(true);

  try {
   const respostaCsrf = await fetch('http://127.0.0.1:8000/api/csrf/', {
  credentials: 'include',
});
const dadosCsrf = await respostaCsrf.json();
 const resposta = await 
 fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
  'Content-Type': 'application/json',
  'X-CSRFToken': dadosCsrf.csrfToken,
},
      credentials: 'include',
      body: JSON.stringify({
        email: loginEmail,
        senha: loginPassword,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setLoginErro(dados.erro || 'Não foi possível entrar.');
      return;
    }

    setUser({
      name: dados.usuario.nome,
      email: dados.usuario.email,
      role: dados.usuario.perfil,
    });

    setLoginOpen(false);
    setPage('dashboard');
  } catch {
    setLoginErro('Não foi possível conectar ao servidor Django.');
  } finally {
    setLoginCarregando(false);
  }
};
    const [loginRole, setLoginRole] = useState('professor');
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registerStep, setRegisterStep] = useState('form');
    const [registerEmail, setRegisterEmail] = useState('');
    const [activeNav, setActiveNav] = useState(null);
    const [page, setPageState] = useState(readSavedPage);

    // Salva a navegação no próprio clique, sem depender apenas de useEffect.
    // Isso evita perder a página atual ao atualizar com F5.
    const setPage = (nextPage) => {
        const resolvedPage = typeof nextPage === 'function' ? nextPage(page) : nextPage;
        setPageState(resolvedPage);
        try {
            if (resolvedPage === 'home') {
                window.localStorage.removeItem(PAGE_STORAGE_KEY);
            } else if (VALID_AUTHENTICATED_PAGES.includes(resolvedPage)) {
                window.localStorage.setItem(PAGE_STORAGE_KEY, resolvedPage);
            }
        } catch (error) {
            console.warn('Não foi possível salvar a página atual.', error);
        }
    };
    const [agendaDate, setAgendaDate] = useState('');
    const [agendaFrom, setAgendaFrom] = useState('minhas-reservas');
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState(null);
    const [reservaStep, setReservaStep] = useState('calendar');
    const [reservaLocal, setReservaLocal] = useState('');
    const [reservaHora, setReservaHora] = useState('');
    const [reservaFinalidade, setReservaFinalidade] = useState('');
    const [reservas, setReservas] = useState(mockReservas);
    const [filterRecurso, setFilterRecurso] = useState('');
    const [filterUsuario, setFilterUsuario] = useState('');
    const [bloqueios, setBloqueios] = useState([{ id: 1, tipo: 'Sala', recurso: 'Sala 04', motivo: 'Reforma elétrica' }]);
    const [novoBloquTipo, setNovoBloquTipo] = useState('Sala');
    const [novoBloquRecurso, setNovoBloquRecurso] = useState('');
    const [novoBloquMotivo, setNovoBloquMotivo] = useState('');
    const [espacos, setEspacos] = useState(mockEspacos);
    const [equipamentos, setEquipamentos] = useState(mockEquipamentos);
    const [eqFilter, setEqFilter] = useState('');
    // Persiste a sessão. Ao sair, apaga usuário e página salva.
    useEffect(() => {
        try {
            if (user) {
                window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            } else {
                window.localStorage.removeItem(AUTH_STORAGE_KEY);
                window.localStorage.removeItem(PAGE_STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Não foi possível salvar a sessão neste navegador.', error);
        }
    }, [user]);

    // Mantém a página salva sincronizada com a navegação atual.
    useEffect(() => {
        try {
            if (user && VALID_AUTHENTICATED_PAGES.includes(page)) {
                window.localStorage.setItem(PAGE_STORAGE_KEY, page);
            } else if (!user) {
                window.localStorage.removeItem(PAGE_STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Não foi possível salvar a página atual.', error);
        }
    }, [page, user]);

    useEffect(() => {
        const h = (e) => { if (profileRef.current && !profileRef.current.contains(e.target))
            setProfileOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const goTo = useCallback((idx) => {
        if (transitioning)
            return;
        setTransitioning(true);
        setTimeout(() => { setCurrent(idx); setTransitioning(false); }, 300);
    }, [transitioning]);
    const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
    const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);
    useEffect(() => { const t = setInterval(next, 5000); return () => clearInterval(t); }, [next]);
    const goPage = (p) => setPage(p);
    const backToDash = () => setPage('dashboard');
    const roleLabel = { professor: 'Professor', coordenacao: 'Coordenação', secretaria: 'Secretaria' };
    const roleNames = { professor: 'Maria Silva', coordenacao: 'Carlos Mendes', secretaria: 'Fernanda Costa' };
    const cancelReserva = (id) => setReservas(rs => rs.map(r => r.id === id ? { ...r, status: 'cancelada' } : r));
    const profCards = [
        { label: 'Solicitar Reserva', icon: '📅', color: '#1a3a5c', desc: 'Reserve salas, labs e equipamentos', action: () => { goPage('reserva'); setReservaStep('calendar'); setSelectedDay(null); } },
        { label: 'Minhas Reservas', icon: '📋', color: '#c4843a', desc: 'Visualize e cancele suas reservas', action: () => goPage('minhas-reservas') },
        { label: 'Consultar Salas / Lab', icon: '🔍', color: '#2e7d5e', desc: 'Veja disponibilidade em tempo real', action: () => goPage('consultar') },
    ];
    const coordCards = [
        { label: 'Todas as Reservas', icon: '📊', color: '#1a3a5c', desc: 'Visualize, filtre e gerencie reservas (RF11-RF13)', action: () => goPage('coord-reservas') },
        { label: 'Bloquear Recursos', icon: '🚫', color: '#c4843a', desc: 'Bloqueie horários, salas, labs e equipamentos (RF14-RF17)', action: () => goPage('coord-bloquear') },
        { label: 'Consultar Disponibilidade', icon: '🔍', color: '#2e7d5e', desc: 'Salas, labs e equipamentos disponíveis (RF20)', action: () => goPage('consultar') },
        { label: 'Relatórios de Utilização', icon: '📈', color: '#6b3fa0', desc: 'Histórico e estatísticas de uso (RF21)', action: () => goPage('coord-relatorios') },
    ];
    const secCards = [
        { label: 'Salas e Laboratórios', icon: '🏫', color: '#1a3a5c', desc: 'Cadastre e gerencie salas e laboratórios (RF22-RF23)', action: () => goPage('sec-salas') },
        { label: 'Equipamentos e Patrimônio', icon: '💻', color: '#c4843a', desc: 'Patrimônio, manutenção e situação (RF24-RF37)', action: () => goPage('sec-equipamentos') },
        { label: 'Histórico e Manutenção', icon: '🔧', color: '#6b3fa0', desc: 'Registre e acompanhe manutenções (RF31-RF32)', action: () => goPage('sec-patrimonio') },
    ];
    const dashCards = user?.role === 'professor' ? profCards : user?.role === 'coordenacao' ? coordCards : secCards;
    return (<div className="app-shell" style={{ background: 'var(--background)', fontFamily: 'var(--font-body)' }}>

      {/* HEADER */}
      <header style={{ borderBottom: '2px solid var(--foreground)', background: 'var(--background)', position: 'sticky', top: 0, zIndex: 50 }} className="app-header">
        <Button variant="link" className="app-rb-button" onClick={() => setPage(user ? 'dashboard' : 'home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--foreground)' }}>SISTEMA DE RESERVAS</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', display: 'block', color: 'var(--muted-foreground)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>E.E. Washington Luiz</span>
        </Button>
        <nav className="app-nav">
          {!user && ['Quem Somos', 'Fale Conosco'].map(l => (<Button variant="link" className="app-rb-button" key={l} onClick={() => setActiveNav(activeNav === l ? null : l)} style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.08em', color: activeNav === l ? 'var(--accent)' : 'var(--foreground)', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', borderBottom: activeNav === l ? '2px solid var(--accent)' : '2px solid transparent', transition: 'color 0.2s' }}>{l}</Button>))}
          {user && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Perfil: <strong style={{ color: 'var(--foreground)' }}>{roleLabel[user.role]}</strong></span>}
        </nav>
        {user ? (<div ref={profileRef} style={{ position: 'relative' }}>
            <Button variant="link" className="app-rb-button" onClick={() => setProfileOpen(o => !o)} style={{ ...btn({ background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Meu Perfil
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </Button>
            {profileOpen && (<div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '2px', minWidth: '190px', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>{user.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>{roleLabel[user.role]}</p>
                </div>
                {[{ label: 'Alterar Cadastro', action: () => setProfileOpen(false) }, { label: 'Sair', action: () => { setUser(null); setPage('home'); setProfileOpen(false); } }].map(({ label: l, action }) => (<Button variant="link" className="app-rb-button" key={l} onClick={action} style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: l === 'Sair' ? '#c0392b' : 'var(--foreground)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{l}</Button>))}
              </div>)}
          </div>) : (<Button variant="link" className="app-rb-button" onClick={() => setLoginOpen(true)} style={{ ...btn({ background: 'var(--primary)', color: '#fff', border: '2px solid var(--primary)' }) }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}>
            Login
          </Button>)}
      </header>

      {/* DASHBOARD */}
      {page === 'dashboard' && user && (<main style={{ flex: 1, padding: '3rem 2rem', background: 'var(--secondary)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.4rem' }}>Bem-vindo de volta · {roleLabel[user.role]}</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2.5rem' }}>Olá, {user.name.split(' ')[0]} 👋</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: '1.25rem' }}>
              {dashCards.map(({ label: l, icon, color, desc, action }) => (<Button variant="link" className="app-rb-button" key={l} onClick={action} style={card(color)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'; }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>{icon}</span>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.4rem', lineHeight: 1.2 }}>{l}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </Button>))}
            </div>
          </div>
        </main>)}

      {page === 'reserva' && user && <PageReserva reservaStep={reservaStep} setReservaStep={setReservaStep} reservaLocal={reservaLocal} setReservaLocal={setReservaLocal} reservaFinalidade={reservaFinalidade} setReservaFinalidade={setReservaFinalidade} calYear={calYear} setCalYear={setCalYear} calMonth={calMonth} setCalMonth={setCalMonth} selectedDay={selectedDay} setSelectedDay={setSelectedDay} setReservas={setReservas} backToDash={backToDash} user={user}/>}
      {page === 'minhas-reservas' && user && <PageMinhasReservas reservas={reservas} user={user} cancelReserva={cancelReserva} backToDash={backToDash} onVerAgenda={d => { setAgendaDate(d); setAgendaFrom('minhas-reservas'); goPage('agenda'); }}/>}
      {page === 'consultar' && user && <PageConsultar equipamentos={equipamentos} bloqueios={bloqueios} reservas={reservas} backToDash={backToDash}/>}
      {page === 'coord-reservas' && user && <PageCoordReservas reservas={reservas} filterRecurso={filterRecurso} setFilterRecurso={setFilterRecurso} filterUsuario={filterUsuario} setFilterUsuario={setFilterUsuario} cancelReserva={cancelReserva} backToDash={backToDash} onSolicitarReserva={() => { goPage('reserva'); setReservaStep('calendar'); setSelectedDay(null); }} onVerAgenda={d => { setAgendaDate(d); setAgendaFrom('coord-reservas'); goPage('agenda'); }}/>}
      {page === 'agenda' && user && <PageAgenda data={agendaDate} reservas={reservas} onBack={() => setPage(agendaFrom)}/>}
      {page === 'coord-bloquear' && user && <PageCoordBloquear bloqueios={bloqueios} setBloqueios={setBloqueios} backToDash={backToDash}/>}
      {page === 'coord-relatorios' && user && <PageRelatorios reservas={reservas} bloqueios={bloqueios} backToDash={backToDash}/>}
      {page === 'sec-equipamentos' && user && <PageEquipamentos equipamentos={equipamentos} setEquipamentos={setEquipamentos} eqFilter={eqFilter} setEqFilter={setEqFilter} backToDash={backToDash}/>}
      {(page === 'sec-salas' || page === 'sec-labs') && user && <PageCadastroEspaco tipoProp={page === 'sec-labs' ? 'Laboratório' : 'Sala'} espacos={espacos} setEspacos={setEspacos} setBloqueios={setBloqueios} backToDash={backToDash}/>}
      {page === 'sec-patrimonio' && user && <PagePatrimonio backToDash={backToDash} reservas={reservas} bloqueios={bloqueios} setBloqueios={setBloqueios} equipamentos={equipamentos} espacos={espacos}/>}

      {/* HOME CAROUSEL */}
      {page === 'home' && (<>
          <section className="home-carousel" style={{ minHeight: '70vh' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease' }}>
              <img src={slides[current].img} alt={slides[current].heading} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,20,40,0.35) 0%, rgba(10,20,40,0.65) 100%)' }}/>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>{String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, maxWidth: '700px', marginBottom: '1.25rem' }}>{slides[current].heading}</h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.95rem,2vw,1.15rem)', fontWeight: 300, color: 'rgba(255,255,255,0.88)', maxWidth: '560px', lineHeight: 1.65, marginBottom: '2.5rem' }}>{slides[current].sub}</p>
              <Button variant="link" className="app-rb-button" onClick={() => setLoginOpen(true)} style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 40px', border: 'none', borderRadius: '2px', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Entrar no Sistema
              </Button>
            </div>
            {[{ dir: 'prev', label: '‹', action: prev }, { dir: 'next', label: '›', action: next }].map(({ dir, label: l, action }) => (<Button variant="link" className="app-rb-button" key={dir} onClick={action} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [dir === 'prev' ? 'left' : 'right']: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '2rem', width: '48px', height: '48px', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} aria-label={dir}>{l}</Button>))}
            <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
              {slides.map((_, i) => <Button variant="link" className="app-rb-button" key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} style={{ width: i === current ? '28px' : '10px', height: '10px', borderRadius: '5px', border: 'none', background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }}/>)}
            </div>
          </section>
          <section style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }} className="feature-strip">
            <div className="feature-grid">
              {[{ label: 'Salas de Aula', value: '48 ambientes' }, { label: 'Laboratórios', value: '12 espaços' }, { label: 'Equipamentos', value: '230+ itens' }].map(({ label: l, value }) => (<div key={l}><p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, fontWeight: 500, marginBottom: '4px' }}>{l}</p><p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>{value}</p></div>))}
            </div>
          </section>
        </>)}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }} className="app-footer">
        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>© 2026 Sistema de Reservas · E.E. Washington Luiz</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>RF01-RF46 · RNF01-RNF24 implementados</span>
      </footer>

      {/* LOGIN MODAL */}
      {loginOpen && (<div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,20,40,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '1rem' }} onClick={() => setLoginOpen(false)}>
          <div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '2.5rem 2rem', width: '100%', maxWidth: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <Button variant="link" className="app-rb-button" onClick={() => setLoginOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--muted-foreground)' }}>✕</Button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Acesso ao Sistema</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>RF01 · Entre com suas credenciais institucionais.</p>            <div style={{ marginBottom: '1rem' }}><label style={label}>Perfil de Acesso (RF38)</label>
              <select style={selectStyle} value={loginRole} onChange={e => setLoginRole(e.target.value)}>
                <option value="professor">Professor</option><option value="coordenacao">Coordenação</option><option value="secretaria">Secretaria</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}><label style={label}>E-mail</label><input type="email" placeholder="usuario@escola.edu.br" onChange={e => setLoginEmail(e.target.value)} style={field}/></div>
            <div style={{ marginBottom: '0.5rem' }}><label style={label}>Senha</label> <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" style={field}/></div>
            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
              <Button variant="link" className="app-rb-button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}>Esqueceu a senha?</Button>
            </div>
            <Button variant="link" className="app-rb-button" onClick={fazerLogin} style={{ ...btn({ width: '100%', background: 'var(--primary)', color: '#fff' }) }}>Entrar</Button>            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ou entre com</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
            </div>
            <Button variant="link" className="app-rb-button" style={{ width: '100%', padding: '11px 12px', background: '#fff', color: '#3c4043', border: '1.5px solid #dadce0', borderRadius: '2px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Entrar com Google
            </Button>
            <Button variant="link" className="app-rb-button" style={{ width: '100%', padding: '11px 12px', background: '#1351b4', color: '#fff', border: 'none', borderRadius: '2px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.25rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#0d3d8a'} onMouseLeave={e => e.currentTarget.style.background = '#1351b4'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="#FFCD07"/><path d="M12 4.5L5 8v4.5c0 3.9 2.8 7.55 7 8.65 4.2-1.1 7-4.75 7-8.65V8L12 4.5z" fill="#1351b4"/><text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">BR</text></svg>
              Entrar com Gov.br
            </Button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Ainda não é cadastrado?{' '}
              <Button variant="link" className="app-rb-button" onClick={() => { setLoginOpen(false); setRegisterStep('form'); setRegisterOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'underline', padding: 0 }}>Criar conta</Button>
            </p>
          </div>
        </div>)}

      {/* CADASTRO MODAL */}
      {registerOpen && (<div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,20,40,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '1rem', overflowY: 'auto' }} onClick={() => setRegisterOpen(false)}>
          <div style={{ background: 'var(--background)', border: '2px solid var(--foreground)', borderRadius: '4px', padding: '2.5rem 2rem', width: '100%', maxWidth: '420px', position: 'relative', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <Button variant="link" className="app-rb-button" onClick={() => setRegisterOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--muted-foreground)' }}>✕</Button>
            {registerStep === 'confirm' ? (<div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--secondary)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Confirme seu e-mail</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.65, marginBottom: '0.5rem' }}>Enviamos um link de confirmação para:</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem' }}>{registerEmail || 'seu e-mail cadastrado'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.65, marginBottom: '2rem' }}>Acesse sua caixa de entrada e clique no link para ativar sua conta. Verifique também a pasta de spam.</p>
                <Button variant="link" className="app-rb-button" onClick={() => { setRegisterOpen(false); setRegisterStep('form'); }} style={{ ...btn({ width: '100%', background: 'var(--primary)', color: '#fff', marginBottom: '1rem' }) }}>Entendido</Button>
                <Button variant="link" className="app-rb-button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'underline', padding: 0 }}>Reenviar link</Button>
              </div>) : (<>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Criar Conta</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>Preencha os dados para solicitar acesso ao sistema.</p>
                {[{ l: 'Nome Completo', t: 'text', ph: 'Seu nome completo', k: 'nome' }, { l: 'CPF', t: 'text', ph: '000.000.000-00', k: 'cpf' }, { l: 'E-mail', t: 'email', ph: 'usuario@escola.edu.br', k: 'email' }, { l: 'Senha', t: 'password', ph: '••••••••', k: 'senha' }, { l: 'Confirmação de Senha', t: 'password', ph: '••••••••', k: 'conf' }, { l: 'CIE — Código Identificador da Escola', t: 'text', ph: 'Ex: 35000000', k: 'cie' }].map(({ l, t, ph, k }) => (<div key={k} style={{ marginBottom: '1rem' }}><label style={label}>{l}</label><input type={t} placeholder={ph} onChange={k === 'email' ? e => setRegisterEmail(e.target.value) : undefined} style={field}/></div>))}
                <div style={{ marginBottom: '1rem' }}><label style={label}>Cargo na Escola</label>
                  <select style={selectStyle}>
                    <option value="">Selecione seu cargo</option><option value="professor">Professor</option><option value="coordenador">Coordenador</option><option value="secretaria">Secretaria</option>
                  </select>
                </div>
                <Button variant="link" className="app-rb-button" onClick={() => setRegisterStep('confirm')} style={{ ...btn({ width: '100%', background: 'var(--primary)', color: '#fff' }) }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>Cadastrar</Button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.25rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ou cadastre-se com</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
                </div>
                <Button variant="link" className="app-rb-button" style={{ width: '100%', padding: '11px 12px', background: '#fff', color: '#3c4043', border: '1.5px solid #dadce0', borderRadius: '2px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Criar conta com Google
                </Button>
                <Button variant="link" className="app-rb-button" style={{ width: '100%', padding: '11px 12px', background: '#1351b4', color: '#fff', border: 'none', borderRadius: '2px', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="#FFCD07"/><path d="M12 4.5L5 8v4.5c0 3.9 2.8 7.55 7 8.65 4.2-1.1 7-4.75 7-8.65V8L12 4.5z" fill="#1351b4"/><text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">BR</text></svg>
                  Criar conta com Gov.br
                </Button>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Já tem uma conta?{' '}
                  <Button variant="link" className="app-rb-button" onClick={() => { setRegisterOpen(false); setRegisterStep('form'); setLoginOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'underline', padding: 0 }}>Fazer login</Button>
                </p>
              </>)}
          </div>
        </div>)}
    </div>);
}
