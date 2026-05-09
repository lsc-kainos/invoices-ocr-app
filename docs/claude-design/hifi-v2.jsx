// hifi-v2.jsx — shadcn-aligned, restraint-first
// Direction: Linear / Vercel Dashboard — neutral, functional, dense.
// Single brand accent: a small copper dot in the logo. No iridescent atmospherics.

// ═══════════════════════════════════════════════════════════════════
// shadcn-style primitives
// ═══════════════════════════════════════════════════════════════════

const V2 = ({ children, style }) => (
  <div
    className="frame-v2"
    style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      color: 'var(--v2-fg)',
      background: 'var(--v2-bg)',
      ...style,
    }}
  >
    {children}
  </div>
);

const Button = ({
  variant = 'primary',
  size = 'default',
  icon,
  iconRight,
  children,
  full,
  style,
  ...props
}) => {
  const variants = {
    primary: { background: 'var(--v2-fg)', color: 'var(--v2-bg)', borderColor: 'transparent' },
    secondary: {
      background: 'var(--v2-surface-2)',
      color: 'var(--v2-fg)',
      borderColor: 'var(--v2-line-strong)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--v2-fg)',
      borderColor: 'var(--v2-line-strong)',
    },
    ghost: { background: 'transparent', color: 'var(--v2-fg-mute)', borderColor: 'transparent' },
  };
  const sizes = {
    sm: { height: 26, padding: '0 8px', fontSize: 12 },
    default: { height: 30, padding: '0 12px', fontSize: 12.5 },
    lg: { height: 36, padding: '0 16px', fontSize: 13 },
    icon: { height: 28, width: 28, padding: 0, fontSize: 12 },
  };
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontFamily: 'inherit',
        fontWeight: 500,
        lineHeight: 1,
        borderRadius: 6,
        border: '1px solid transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        width: full ? '100%' : size === 'icon' ? sizes.icon.width : 'auto',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
      {iconRight && <Icon name={iconRight} size={13} />}
    </button>
  );
};

const Input = ({ icon, kbd, style, ...props }) => (
  <div style={{ position: 'relative', width: '100%' }}>
    {icon && (
      <Icon
        name={icon}
        size={13}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--v2-fg-dim)',
        }}
      />
    )}
    <input
      style={{
        width: '100%',
        height: 30,
        background: 'var(--v2-surface)',
        border: '1px solid var(--v2-line-strong)',
        color: 'var(--v2-fg)',
        padding: `0 ${kbd ? 40 : 12}px 0 ${icon ? 30 : 12}px`,
        borderRadius: 6,
        fontSize: 12.5,
        fontFamily: 'inherit',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
    {kbd && (
      <Kbd style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
        {kbd}
      </Kbd>
    )}
  </div>
);

const Kbd = ({ children, style }) => (
  <kbd
    style={{
      fontSize: 10,
      color: 'var(--v2-fg-dim)',
      fontFamily: 'var(--font-mono)',
      padding: '2px 5px',
      border: '1px solid var(--v2-line-strong)',
      borderRadius: 3,
      background: 'var(--v2-surface)',
      lineHeight: 1,
      ...style,
    }}
  >
    {children}
  </kbd>
);

const Badge = ({ variant = 'default', children, style }) => {
  const variants = {
    default: {
      background: 'var(--v2-surface-2)',
      color: 'var(--v2-fg)',
      borderColor: 'var(--v2-line-strong)',
    },
    secondary: {
      background: 'var(--v2-surface)',
      color: 'var(--v2-fg-mute)',
      borderColor: 'var(--v2-line)',
    },
    success: {
      background: 'oklch(0.18 0.04 145)',
      color: 'var(--v2-good)',
      borderColor: 'oklch(0.28 0.06 145)',
    },
    warning: {
      background: 'oklch(0.18 0.04 75)',
      color: 'var(--v2-warn)',
      borderColor: 'oklch(0.28 0.06 75)',
    },
    danger: {
      background: 'oklch(0.18 0.06 25)',
      color: 'var(--v2-bad)',
      borderColor: 'oklch(0.28 0.08 25)',
    },
    accent: {
      background: 'oklch(0.18 0.04 42)',
      color: 'var(--v2-copper)',
      borderColor: 'oklch(0.28 0.06 42)',
    },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        padding: '3px 7px',
        borderRadius: 4,
        border: '1px solid',
        whiteSpace: 'nowrap',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
};

const StatusDot = ({ tone = 'success', pulse }) => {
  const colors = {
    success: 'var(--v2-good)',
    warning: 'var(--v2-warn)',
    danger: 'var(--v2-bad)',
    muted: 'var(--v2-fg-dim)',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: 999,
        background: colors[tone],
        boxShadow: pulse ? `0 0 0 3px ${colors[tone]}33` : 'none',
      }}
    />
  );
};

const Avatar = ({ initials, size = 26, accent }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: accent || 'oklch(0.32 0.04 80)',
      color: 'var(--v2-fg)',
      display: 'inline-grid',
      placeItems: 'center',
      fontSize: Math.max(10, size * 0.4),
      fontWeight: 500,
      border: '1px solid var(--v2-line-strong)',
      flexShrink: 0,
      fontVariant: 'small-caps',
    }}
  >
    {initials}
  </div>
);

const Separator = ({ orientation = 'horizontal', style }) => (
  <div
    style={{
      background: 'var(--v2-line)',
      ...(orientation === 'horizontal'
        ? { height: 1, width: '100%' }
        : { width: 1, alignSelf: 'stretch' }),
      ...style,
    }}
  />
);

// shadcn Card — quiet container
const Card = ({ children, style, ...props }) => (
  <div
    style={{
      background: 'var(--v2-surface)',
      border: '1px solid var(--v2-line)',
      borderRadius: 8,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const Progress = ({ value = 0, height = 4 }) => (
  <div
    style={{
      height,
      background: 'var(--v2-surface-2)',
      borderRadius: 999,
      overflow: 'hidden',
      border: '1px solid var(--v2-line)',
    }}
  >
    <div
      style={{
        width: `${value}%`,
        height: '100%',
        background: 'var(--v2-fg)',
        transition: 'width 200ms ease',
      }}
    />
  </div>
);

// shadcn Tabs (visual only)
const Tabs = ({ items, active, onSelect }) => (
  <div
    role="tablist"
    style={{
      display: 'inline-flex',
      gap: 2,
      padding: 3,
      background: 'var(--v2-surface)',
      border: '1px solid var(--v2-line)',
      borderRadius: 7,
    }}
  >
    {items.map((it) => {
      const on = it.value === active;
      return (
        <button
          key={it.value}
          role="tab"
          onClick={() => onSelect?.(it.value)}
          style={{
            height: 24,
            padding: '0 10px',
            background: on ? 'var(--v2-surface-2)' : 'transparent',
            color: on ? 'var(--v2-fg)' : 'var(--v2-fg-mute)',
            border: on ? '1px solid var(--v2-line-strong)' : '1px solid transparent',
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {it.label}
          {it.count != null && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--v2-fg-dim)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {it.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// Brand mark — single copper dot, no gradients
// ═══════════════════════════════════════════════════════════════════

const Logo = ({ size = 22 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: 'var(--v2-fg)',
        color: 'var(--v2-bg)',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        fontSize: size * 0.55,
        letterSpacing: '-0.04em',
        position: 'relative',
      }}
    >
      i
      <span
        style={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 4,
          height: 4,
          borderRadius: 999,
          background: 'var(--v2-copper)',
        }}
      />
    </div>
    <span
      style={{
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '-0.015em',
        color: 'var(--v2-fg)',
      }}
    >
      Invoices
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// Topbar — Linear-style: workspace + nav + search + actions
// ═══════════════════════════════════════════════════════════════════

const V2Topbar = ({ active = 'invoices' }) => {
  const items = [
    { k: 'home', label: 'Início' },
    { k: 'invoices', label: 'Minhas notas' },
    { k: 'chat', label: 'Chat' },
  ];
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 24px',
        height: 52,
        borderBottom: '1px solid var(--v2-line)',
        flex: '0 0 auto',
        background: 'var(--v2-bg)',
      }}
    >
      <Logo />

      {/* workspace switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 14,
          padding: '4px 8px',
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >
        <span style={{ color: 'var(--v2-fg-dim)', fontSize: 13 }}>/</span>
        <Avatar initials="KL" size={18} accent="oklch(0.42 0.08 60)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Kainos Labs</span>
        <Icon name="chevronDown" size={11} style={{ color: 'var(--v2-fg-dim)', marginLeft: 2 }} />
      </div>

      <Separator
        orientation="vertical"
        style={{ margin: '0 6px', height: 18, alignSelf: 'center' }}
      />

      <nav style={{ display: 'flex', gap: 0 }}>
        {items.map((it) => {
          const on = it.k === active;
          return (
            <a
              key={it.k}
              href="#"
              style={{
                fontSize: 13,
                padding: '6px 10px',
                borderRadius: 5,
                color: on ? 'var(--v2-fg)' : 'var(--v2-fg-mute)',
                background: on ? 'var(--v2-surface-2)' : 'transparent',
                textDecoration: 'none',
                fontWeight: on ? 500 : 400,
              }}
            >
              {it.label}
            </a>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ width: 260 }}>
        <Input icon="search" kbd="⌘K" placeholder="Buscar notas, CNPJ, valores…" />
      </div>

      <Button variant="secondary" size="default" icon="upload">
        Nova nota
      </Button>

      <Avatar initials="rc" size={26} accent="oklch(0.45 0.1 42)" />
    </header>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 01 · LOGIN — minimal, sans-serif, adaptativo (sem cursivas, sem
// claims fictícios). Coluna editorial só em desktop largo.
// ═══════════════════════════════════════════════════════════════════

const HifiV2Login = () => (
  <V2 style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    {/* ─── Left: brand presence (desktop) ─── */}
    <div
      style={{
        padding: '40px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid var(--v2-line)',
        background: 'var(--v2-bg)',
      }}
    >
      <Logo />
      {/* Animação real no /login (apps/web), em duas fases (apenas
          desktop — hero é hidden lg:flex no mobile):

          FASE 1 (0–1500ms): hero ocupa 100% da viewport
            t=0    Logo aparece (slide+fade)
            t=300  HEADLINE nasce (zoom-in-95 + fade, 1000ms)
            t=900  subtítulo desliza
            t=1400 tagline

          FASE 2 (1500ms+): grid-template-columns anima de
          [1fr_0fr] → [1fr_1fr] em 1000ms. A border-r do hero, antes
          invisível no bezel, vira a linha divisória "construída".
            t=1500 H2 "Entrar"
            t=2000 subtítulo do card
            t=2200 botões OAuth (CTA)
            t=2700 Termos · Privacidade

          Botões: spinner (Loader2) substitui o logo do provider
          clicado durante o round-trip OAuth + active:scale-[0.98]. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--v2-fg)',
          }}
        >
          Notas fiscais, conversáveis.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--v2-fg-mute)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Entre na plataforma e descubra um novo nível de gestão de suas notas.
        </p>
      </div>
      <span style={{ fontSize: 12, color: 'var(--v2-fg-dim)' }}>Invoices · 2026</span>
    </div>

    {/* ─── Right: auth card ─── */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 500,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Entrar
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--v2-fg-mute)',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Acesse seu workspace com a conta do trabalho.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="secondary" size="lg" full style={{ justifyContent: 'center', gap: 10 }}>
            <GoogleLogo size={15} /> Continuar com Google
          </Button>
          <Button variant="secondary" size="lg" full style={{ justifyContent: 'center', gap: 10 }}>
            <GithubLogo size={15} /> Continuar com GitHub
          </Button>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--v2-line)',
            fontSize: 11,
            color: 'var(--v2-fg-dim)',
            lineHeight: 1.6,
          }}
        >
          <a href="#" style={{ color: 'var(--v2-fg-mute)' }}>
            Termos
          </a>{' '}
          ·{' '}
          <a href="#" style={{ color: 'var(--v2-fg-mute)' }}>
            Privacidade
          </a>
        </div>
      </div>
    </div>
  </V2>
);

// ═══════════════════════════════════════════════════════════════════
// 02 · LISTA — Vercel-deployments-meets-Linear table
// ═══════════════════════════════════════════════════════════════════

const HifiV2List = () => {
  const docs = [
    {
      n: 'NF-e 0023117',
      emit: 'Construtora Vega LTDA',
      cnpj: '12.345.678/0001-90',
      val: '184.520,00',
      date: 'há 12min',
      status: 'ready',
      q: 5,
      t: 'NF-e',
    },
    {
      n: 'NF-e 0023118',
      emit: 'Cimentos Itaú LTDA',
      cnpj: '78.954.110/0001-08',
      val: '32.880,40',
      date: 'há 3h',
      status: 'ready',
      q: 2,
      t: 'NF-e',
    },
    {
      n: 'NFS-e 4421',
      emit: 'Engenharia ATR',
      cnpj: '09.882.541/0001-77',
      val: '78.900,00',
      date: 'há 5h',
      status: 'processing',
      q: 0,
      t: 'NFS-e',
    },
    {
      n: 'NF-e 0023116',
      emit: 'BP Incorporadora SA',
      cnpj: '45.218.943/0001-22',
      val: '2.450.000,00',
      date: 'ontem',
      status: 'ready',
      q: 12,
      t: 'NF-e',
    },
    {
      n: 'NFS-e 4419',
      emit: 'Hype Materiais',
      cnpj: '56.443.219/0001-04',
      val: '4.220,00',
      date: 'ontem',
      status: 'ready',
      q: 1,
      t: 'NFS-e',
    },
    {
      n: 'NF-e 0023115',
      emit: 'Construtora Vega LTDA',
      cnpj: '12.345.678/0001-90',
      val: '92.110,00',
      date: '2 dias',
      status: 'failed',
      q: 0,
      t: 'NF-e',
    },
    {
      n: 'NF-e 0023089',
      emit: 'Materiais SP LTDA',
      cnpj: '33.872.401/0001-15',
      val: '18.420,00',
      date: '3 dias',
      status: 'ready',
      q: 3,
      t: 'NF-e',
    },
  ];

  const StatusBadge = ({ s }) => {
    if (s === 'ready')
      return (
        <Badge variant="success">
          <StatusDot tone="success" />
          Pronta
        </Badge>
      );
    if (s === 'processing')
      return (
        <Badge variant="warning">
          <StatusDot tone="warning" pulse />
          Processando
        </Badge>
      );
    if (s === 'failed')
      return (
        <Badge variant="danger">
          <StatusDot tone="danger" />
          Falhou
        </Badge>
      );
    return (
      <Badge variant="secondary">
        <StatusDot tone="muted" />
        {s}
      </Badge>
    );
  };

  const [tab, setTab] = React.useState('all');

  return (
    <V2 style={{ display: 'flex', flexDirection: 'column' }}>
      <V2Topbar active="invoices" />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* page header */}
        <div
          data-list-header
          style={{
            padding: '24px 32px 18px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 500,
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Minhas notas
            </h1>
            <p style={{ fontSize: 13, color: 'var(--v2-fg-mute)', marginTop: 6, lineHeight: 1.5 }}>
              Todas as NF-e e NFS-e processadas pelo seu workspace.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="default" icon="filter">
              Filtros
            </Button>
            <Button variant="outline" size="icon" title="Exportar">
              <Icon name="download" size={13} />
            </Button>
            <Button variant="primary" size="default" icon="upload">
              Nova nota
            </Button>
          </div>
        </div>

        {/* tabs */}
        <div
          style={{
            padding: '0 32px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Tabs
            active={tab}
            onSelect={setTab}
            items={[
              { value: 'all', label: 'Todas', count: 127 },
              { value: 'nfe', label: 'NF-e', count: 92 },
              { value: 'nfse', label: 'NFS-e', count: 30 },
              { value: 'pending', label: 'Pendentes', count: 5 },
            ]}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: 'var(--v2-fg-dim)',
            }}
          >
            <span>Ordenar:</span>
            <Button variant="ghost" size="sm" iconRight="chevronDown">
              Mais recentes
            </Button>
          </div>
        </div>

        {/* table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }}>
          <div
            style={{
              border: '1px solid var(--v2-line)',
              borderRadius: 8,
              background: 'var(--v2-surface)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--v2-surface-2)' }}>
                  {[
                    { l: 'Nota', w: 'auto' },
                    { l: 'Emissor', w: 'auto' },
                    { l: 'Valor (BRL)', w: 140, a: 'right' },
                    { l: 'Status', w: 130 },
                    { l: 'Processado', w: 110 },
                    { l: 'Perguntas', w: 80, a: 'right' },
                    { l: '', w: 36 },
                  ].map((c) => (
                    <th
                      key={c.l}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--v2-fg-dim)',
                        textAlign: c.a || 'left',
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--v2-line)',
                        width: c.w,
                      }}
                    >
                      {c.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < docs.length - 1 ? '1px solid var(--v2-line)' : 0,
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Badge
                          variant="secondary"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '2px 5px',
                          }}
                        >
                          {d.t}
                        </Badge>
                        <span
                          style={{
                            color: 'var(--v2-fg)',
                            fontWeight: 500,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                          }}
                        >
                          {d.n.replace(d.t + ' ', '')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: 'var(--v2-fg)' }}>{d.emit}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--v2-fg-dim)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: 1,
                        }}
                      >
                        {d.cnpj}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 500,
                      }}
                    >
                      {d.val}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <StatusBadge s={d.status} />
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--v2-fg-mute)', fontSize: 12 }}>
                      {d.date}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        color: d.q ? 'var(--v2-fg-mute)' : 'var(--v2-fg-dim)',
                      }}
                    >
                      {d.q || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Button variant="ghost" size="icon">
                        <Icon name="more" size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* table footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderTop: '1px solid var(--v2-line)',
                fontSize: 12,
                color: 'var(--v2-fg-dim)',
                background: 'var(--v2-surface-2)',
              }}
            >
              <span>
                <span style={{ color: 'var(--v2-fg-mute)', fontVariantNumeric: 'tabular-nums' }}>
                  1–7
                </span>{' '}
                de <span style={{ fontVariantNumeric: 'tabular-nums' }}>127</span>
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="outline" size="sm" disabled icon="chevronLeft">
                  Anterior
                </Button>
                <Button variant="outline" size="sm" iconRight="chevronRight">
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </V2>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 03 · UPLOAD — focused dropzone + clean stepper
// ═══════════════════════════════════════════════════════════════════

const HifiV2Upload = () => (
  <V2 style={{ display: 'flex', flexDirection: 'column' }}>
    <V2Topbar active="home" />

    <div style={{ flex: 1, overflow: 'auto' }}>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 24px 48px',
        }}
      >
        {/* breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--v2-fg-dim)',
            marginBottom: 18,
          }}
        >
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
            Início
          </a>
          <Icon name="chevronRight" size={11} />
          <span style={{ color: 'var(--v2-fg)' }}>Nova nota</span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Nova nota
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--v2-fg-mute)',
            marginTop: 6,
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          Envie um arquivo de NF-e ou NFS-e. A extração roda automaticamente e leva, em média, 12s.
        </p>

        {/* dropzone card */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              border: '1px dashed var(--v2-line-strong)',
              borderRadius: 7,
              margin: 12,
              background: 'var(--v2-bg)',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'var(--v2-surface-2)',
                border: '1px solid var(--v2-line-strong)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--v2-fg-mute)',
              }}
            >
              <Icon name="upload" size={17} stroke={1.6} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--v2-fg)' }}>
                Arraste o arquivo aqui
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-fg-mute)', marginTop: 4 }}>
                ou{' '}
                <a
                  href="#"
                  style={{
                    color: 'var(--v2-fg)',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--v2-line-strong)',
                  }}
                >
                  selecione do computador
                </a>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--v2-fg-dim)',
                marginTop: 4,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span>JPG, PNG, PDF</span>
              <span
                style={{
                  width: 3,
                  height: 3,
                  background: 'var(--v2-line-strong)',
                  borderRadius: 999,
                }}
              />
              <span>Até 25 MB</span>
            </div>
          </div>
        </Card>

        {/* current upload card */}
        <Card style={{ padding: 14, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Badge variant="secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              NF-e
            </Badge>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--v2-fg)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                NF-e_0023117_construtora-vega.pdf
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--v2-fg-dim)',
                  marginTop: 2,
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                2.4 MB · 68%
              </div>
            </div>
            <Badge variant="warning">
              <StatusDot tone="warning" pulse />
              Extraindo
            </Badge>
            <Button variant="ghost" size="icon">
              <Icon name="x" size={13} />
            </Button>
          </div>

          <Progress value={68} />

          {/* step ladder */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 14,
              fontSize: 11,
            }}
          >
            {[
              { l: 'Upload', s: 'done' },
              { l: 'OCR', s: 'active' },
              { l: 'Estrutura', s: 'pending' },
              { l: 'Pronta', s: 'pending' },
            ].map((st, i, arr) => (
              <React.Fragment key={st.l}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      flexShrink: 0,
                      background:
                        st.s === 'done'
                          ? 'var(--v2-fg)'
                          : st.s === 'active'
                            ? 'var(--v2-surface-2)'
                            : 'var(--v2-surface)',
                      border: st.s === 'done' ? 0 : '1px solid var(--v2-line-strong)',
                      color: 'var(--v2-bg)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    {st.s === 'done' ? (
                      <Icon name="check" size={10} stroke={2.6} />
                    ) : st.s === 'active' ? (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: 'var(--v2-fg)',
                        }}
                      />
                    ) : (
                      <span style={{ color: 'var(--v2-fg-dim)' }}>{i + 1}</span>
                    )}
                  </div>
                  <span
                    style={{
                      color: st.s === 'pending' ? 'var(--v2-fg-dim)' : 'var(--v2-fg)',
                      fontWeight: st.s === 'active' ? 500 : 400,
                    }}
                  >
                    {st.l}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{ flex: 1, height: 1, background: 'var(--v2-line)', margin: '0 10px' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* helper rows */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[
            {
              i: 'check',
              t: 'O arquivo permanece criptografado e visível apenas para o seu workspace.',
            },
            {
              i: 'sparkle',
              t: 'Identificamos automaticamente NF-e (modelo 55) e NFS-e (modelo 99) por padrões da chave de acesso.',
            },
            {
              i: 'fileText',
              t: 'Documentos com mais de 1 página são processados como uma única nota.',
            },
          ].map((h) => (
            <div
              key={h.t}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 12,
                color: 'var(--v2-fg-mute)',
                lineHeight: 1.5,
              }}
            >
              <Icon
                name={h.i}
                size={13}
                style={{ color: 'var(--v2-fg-dim)', marginTop: 2, flexShrink: 0 }}
              />
              <span>{h.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </V2>
);

// ═══════════════════════════════════════════════════════════════════
// 04 · DETALHE — Linear-issue-page energy: header + tabs + chat
// ═══════════════════════════════════════════════════════════════════

// ─── shared invoice document (used by Detail + Chat) ───────────────
// renders a fake DANFE preview; bboxes get drawn as overlay rectangles
// when their key is in the `highlight` set
const INVOICE_BBOX = {
  numero: { top: '4.5%', right: '4%', width: '32%', height: '4.2%', label: 'Número' },
  chave: { top: '14.5%', left: '4%', width: '92%', height: '3.8%', label: 'Chave' },
  cnpjEmi: { top: '21%', left: '4%', width: '40%', height: '3.6%', label: 'CNPJ emissor' },
  cnpjDes: { top: '21%', right: '4%', width: '38%', height: '3.6%', label: 'CNPJ dest.' },
  itens: { top: '36%', left: '4%', width: '92%', height: '46%', label: 'Itens' },
  valor: { bottom: '5%', right: '4%', width: '28%', height: '8%', label: 'Valor total' },
};

const BBox = ({ k, active }) => {
  const b = INVOICE_BBOX[k];
  if (!b) return null;
  return (
    <div
      style={{
        position: 'absolute',
        ...b,
        border: `1.5px solid ${active ? 'var(--v2-copper)' : 'transparent'}`,
        background: active ? 'oklch(0.74 0.13 42 / 0.12)' : 'transparent',
        borderRadius: 2,
        transition: 'all 140ms ease',
        pointerEvents: 'none',
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -1.5,
            background: 'var(--v2-copper)',
            color: '#1a0e05',
            fontSize: 9,
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: '2px 2px 2px 0',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {INVOICE_BBOX[k].label}
        </div>
      )}
    </div>
  );
};

const InvoiceDoc = ({ highlight = [], scale = 1 }) => {
  const set = new Set(highlight);
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        aspectRatio: '210/297',
        background: 'oklch(0.96 0.005 90)',
        color: '#1a1812',
        borderRadius: 3,
        boxShadow: '0 16px 40px -16px rgba(0,0,0,0.6), 0 0 0 1px var(--v2-line-strong)',
        padding: `${20 * scale}px ${24 * scale}px`,
        fontFamily: 'var(--font-mono)',
        fontSize: 6.5 * scale,
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1a1812',
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 8 * scale }}>NOTA FISCAL ELETRÔNICA</div>
        <div>nº 0023117 · Série 001</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700 }}>EMITENTE</div>
          <div>CONSTRUTORA VEGA LTDA</div>
          <div>CNPJ: 12.345.678/0001-90</div>
          <div>Av. Paulista, 1500 — São Paulo/SP</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>DESTINATÁRIO</div>
          <div>BP INCORPORADORA SA</div>
          <div>CNPJ: 45.218.943/0001-22</div>
          <div>R. Funchal, 200 — São Paulo/SP</div>
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid #1a1812',
          borderBottom: '1px solid #1a1812',
          padding: '4px 0',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700 }}>CHAVE DE ACESSO</span>
        <span>3525 1112 3456 7800 0190 5500 1000 2311 7100 0023 11</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {[
          'Cimento Portland CP-II',
          'Aço CA-50 vergalhão 12mm',
          'Brita 0',
          'Areia média lavada',
          'Tijolo cerâmico 9 furos',
          'Pregos 17x21',
          'Telha cerâmica colonial',
          'Argamassa colante AC-II',
        ].map((it, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '30px 1fr 50px 64px',
              gap: 4,
              padding: '2px 0',
              borderBottom: '1px solid #d6d3c9',
            }}
          >
            <span>{String(i + 1).padStart(3, '0')}</span>
            <span>{it}</span>
            <span>{[40, 200, 30, 50, 5000, 10, 800, 80][i]} un</span>
            <span>
              R${' '}
              {[12340, 45200, 8900, 4400, 12500, 890, 32000, 8900][i].toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 16, right: 24, textAlign: 'right' }}>
        <div>VALOR TOTAL</div>
        <div style={{ fontSize: 14 * scale, fontWeight: 700 }}>R$ 184.520,00</div>
      </div>

      {/* bbox overlay */}
      {Object.keys(INVOICE_BBOX).map((k) => (
        <BBox key={k} k={k} active={set.has(k)} />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 04 · DETALHE — viewer with OCR overlay + chat as primary surface
// ═══════════════════════════════════════════════════════════════════

const HifiV2Detail = () => {
  const [hl, setHl] = React.useState([]); // active bbox highlights
  const [pane, setPane] = React.useState('chat');

  const fieldsHL = (k) => hl.includes(k);
  const fields = [
    { k: 'Tipo', v: 'NF-e (Modelo 55)' },
    { k: 'Número', v: '0023117', mono: true, bbox: 'numero' },
    { k: 'Data', v: '07/05/2025 14:22', mono: true },
    {
      k: 'Chave de acesso',
      v: '3525 1112 3456 7800 0190 5500 1000 2311 7100 0023 11',
      mono: true,
      span: 2,
      bbox: 'chave',
    },
    { k: 'CNPJ emissor', v: '12.345.678/0001-90', mono: true, bbox: 'cnpjEmi' },
    { k: 'Razão social', v: 'Construtora Vega LTDA' },
    { k: 'CNPJ destinatário', v: '45.218.943/0001-22', mono: true, bbox: 'cnpjDes' },
    { k: 'Razão social dest.', v: 'BP Incorporadora SA' },
    { k: 'Itens', v: '8 produtos', mono: true, bbox: 'itens' },
    { k: 'Valor total', v: 'R$ 184.520,00', mono: true, highlight: true, bbox: 'valor' },
  ];

  const Cite = ({ bbox, children }) => (
    <span
      onMouseEnter={() => setHl([bbox])}
      onMouseLeave={() => setHl([])}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'var(--v2-surface-2)',
        border: '1px solid var(--v2-line-strong)',
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        color: 'var(--v2-fg-mute)',
        cursor: 'pointer',
        verticalAlign: 'baseline',
      }}
    >
      <Icon name="fileText" size={9} />
      {children}
    </span>
  );

  return (
    <V2 style={{ display: 'flex', flexDirection: 'column' }}>
      <V2Topbar active="invoices" />

      {/* page header */}
      <div
        style={{ padding: '14px 28px', borderBottom: '1px solid var(--v2-line)', flex: '0 0 auto' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--v2-fg-dim)',
            marginBottom: 8,
          }}
        >
          <a
            href="#"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Icon name="arrowLeft" size={11} />
            Minhas notas
          </a>
          <Icon name="chevronRight" size={10} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>NF-e 0023117</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: '-0.015em' }}>
              NF-e{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--v2-fg-mute)' }}>
                nº 0023117
              </span>
            </h1>
            <Badge variant="success">
              <StatusDot tone="success" />
              Pronta
            </Badge>
            <span style={{ fontSize: 12, color: 'var(--v2-fg-mute)' }}>Construtora Vega LTDA</span>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--v2-fg)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              R$ 184.520,00
            </span>
            <span style={{ fontSize: 12, color: 'var(--v2-fg-mute)' }}>07/05/2025</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="default" icon="download">
              Exportar
            </Button>
            <Button variant="outline" size="icon">
              <Icon name="more" size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* main grid: viewer+chat (left col) | fields rail (right) */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            borderRight: '1px solid var(--v2-line)',
          }}
        >
          {/* viewer */}
          <div
            style={{
              flex: '0 0 44%',
              background: 'var(--v2-surface)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              borderBottom: '1px solid var(--v2-line)',
            }}
          >
            <InvoiceDoc highlight={hl} scale={1.1} />

            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                gap: 4,
                padding: 3,
                background: 'var(--v2-surface-2)',
                border: '1px solid var(--v2-line)',
                borderRadius: 6,
              }}
            >
              <Button variant="ghost" size="icon">
                <Icon name="zoomOut" size={12} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="zoomIn" size={12} />
              </Button>
              <Separator orientation="vertical" style={{ height: 14, alignSelf: 'center' }} />
              <Button variant="ghost" size="icon">
                <Icon name="rotate" size={12} />
              </Button>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontSize: 10,
                color: 'var(--v2-fg-dim)',
                background: 'var(--v2-surface-2)',
                border: '1px solid var(--v2-line)',
                borderRadius: 5,
                padding: '3px 8px',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              1 / 1 · 100%
            </div>
          </div>

          {/* tabs + content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              style={{
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--v2-line)',
              }}
            >
              <Tabs
                active={pane}
                onSelect={setPane}
                items={[
                  { value: 'chat', label: 'Conversa', count: 4 },
                  { value: 'raw', label: 'Texto bruto' },
                  { value: 'history', label: 'Histórico' },
                ]}
              />
              {pane === 'chat' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12,
                    color: 'var(--v2-fg-dim)',
                  }}
                >
                  <Avatar initials="ai" size={18} accent="var(--v2-surface-2)" />
                  Assistente · GPT-4o
                  <Button variant="ghost" size="sm" icon="trash">
                    Limpar
                  </Button>
                </div>
              )}
            </div>

            {pane === 'chat' && <DetailChat Cite={Cite} />}

            {pane === 'raw' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '18px 28px' }}>
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    lineHeight: 1.7,
                    color: 'var(--v2-fg-mute)',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >{`NOTA FISCAL ELETRÔNICA
Nº 0023117  •  SÉRIE 001  •  EMISSÃO 07/05/2025 14:22

EMITENTE
CONSTRUTORA VEGA LTDA
CNPJ 12.345.678/0001-90
Av. Paulista, 1500 — São Paulo/SP

DESTINATÁRIO
BP INCORPORADORA SA
CNPJ 45.218.943/0001-22
R. Funchal, 200 — São Paulo/SP

CHAVE DE ACESSO
3525 1112 3456 7800 0190 5500 1000 2311 7100 0023 11

ITENS
001  Cimento Portland CP-II      40 un       R$ 12.340,00
002  Aço CA-50 vergalhão 12mm    200 un      R$ 45.200,00
003  Brita 0                     30 un       R$  8.900,00
…

VALOR TOTAL ............................... R$ 184.520,00`}</pre>
              </div>
            )}

            {pane === 'history' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '18px 28px' }}>
                {[
                  {
                    t: '07/05 14:22',
                    a: 'Upload',
                    who: 'Rafael C.',
                    desc: 'Arquivo enviado · NF-e_0023117_vega.pdf',
                  },
                  {
                    t: '07/05 14:22',
                    a: 'OCR',
                    who: 'Sistema',
                    desc: 'Texto extraído em 8.4s · 99,4% confiança',
                  },
                  {
                    t: '07/05 14:23',
                    a: 'Estrutura',
                    who: 'Sistema',
                    desc: '10 campos identificados',
                  },
                  {
                    t: '07/05 14:34',
                    a: 'Pergunta',
                    who: 'Rafael C.',
                    desc: '"Qual é o valor total e quantos itens?"',
                  },
                ].map((h, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 12, fontSize: 12, paddingBottom: 14 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: 'var(--v2-line-strong)',
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 500 }}>{h.a}</span>
                        <span style={{ color: 'var(--v2-fg-dim)' }}>· {h.who}</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ color: 'var(--v2-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                          {h.t}
                        </span>
                      </div>
                      <div style={{ color: 'var(--v2-fg-mute)' }}>{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right rail: extracted fields */}
        <div
          style={{
            background: 'var(--v2-surface)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--v2-line)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 2,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Campos extraídos</h3>
              <span
                style={{ fontSize: 10, color: 'var(--v2-fg-dim)', fontFamily: 'var(--font-mono)' }}
              >
                10
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--v2-fg-dim)' }}>
              Passe o mouse para ver no documento
            </div>
          </div>

          <div style={{ padding: '8px 0', flex: 1 }}>
            {fields.map((f) => (
              <div
                key={f.k}
                onMouseEnter={() => f.bbox && setHl([f.bbox])}
                onMouseLeave={() => setHl([])}
                style={{
                  padding: '7px 18px',
                  cursor: f.bbox ? 'pointer' : 'default',
                  borderLeft: '2px solid transparent',
                  ...(fieldsHL(f.bbox)
                    ? { background: 'var(--v2-surface-2)', borderLeftColor: 'var(--v2-copper)' }
                    : {}),
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--v2-fg-dim)' }}>{f.k}</span>
                  {f.bbox && (
                    <Icon
                      name="eye"
                      size={10}
                      style={{ color: fieldsHL(f.bbox) ? 'var(--v2-copper)' : 'var(--v2-fg-dim)' }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: f.highlight ? 14 : 12,
                    fontFamily: f.mono ? 'var(--font-mono)' : 'inherit',
                    color: f.highlight ? 'var(--v2-copper)' : 'var(--v2-fg)',
                    fontWeight: f.highlight ? 500 : 400,
                    fontVariantNumeric: f.mono ? 'tabular-nums' : 'normal',
                    letterSpacing: f.mono ? '-0.01em' : 'inherit',
                    wordBreak: 'break-word',
                  }}
                >
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </V2>
  );
};

// ─── chat thread inside the Detail page ──────────────────────────────
const DetailChat = ({ Cite }) => (
  <>
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px 28px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <div style={{ maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar initials="ai" size={26} accent="var(--v2-surface-2)" />
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontSize: 13, color: 'var(--v2-fg-mute)', lineHeight: 1.65 }}>
              Olá. Já processei essa nota — 10 campos identificados, 99,4% de confiança no OCR.
              Pergunte o que quiser sobre valores, itens ou impostos.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 720,
          alignSelf: 'center',
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ maxWidth: '78%' }}>
          <div
            style={{
              background: 'var(--v2-surface-2)',
              border: '1px solid var(--v2-line-strong)',
              borderRadius: '10px 10px 2px 10px',
              padding: '8px 12px',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'var(--v2-fg)',
            }}
          >
            Qual é o valor total, quantos itens tem, e qual é o item mais caro?
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--v2-fg-dim)',
              textAlign: 'right',
              marginTop: 4,
              fontFamily: 'var(--font-mono)',
            }}
          >
            14:34
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar initials="ai" size={26} accent="var(--v2-surface-2)" />
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--v2-fg)' }}>
              Resumo desta nota:
            </div>

            <div
              style={{
                marginTop: 10,
                border: '1px solid var(--v2-line)',
                borderRadius: 7,
                background: 'var(--v2-surface)',
                overflow: 'hidden',
                fontSize: 12.5,
              }}
            >
              {[
                { k: 'Valor total', v: 'R$ 184.520,00', cite: 'valor', mono: true, bold: true },
                { k: 'Itens', v: '8 produtos', cite: 'itens', mono: true },
                {
                  k: 'Item mais caro',
                  v: 'Aço CA-50 12mm — R$ 45.200,00',
                  cite: 'itens',
                  mono: true,
                },
              ].map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr auto',
                    gap: 12,
                    padding: '8px 12px',
                    alignItems: 'center',
                    borderBottom: i < 2 ? '1px solid var(--v2-line)' : 0,
                  }}
                >
                  <span style={{ color: 'var(--v2-fg-dim)' }}>{r.k}</span>
                  <span
                    style={{
                      fontFamily: r.mono ? 'var(--font-mono)' : 'inherit',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: r.bold ? 500 : 400,
                      color: r.bold ? 'var(--v2-copper)' : 'var(--v2-fg)',
                    }}
                  >
                    {r.v}
                  </span>
                  <Cite bbox={r.cite}>{INVOICE_BBOX[r.cite].label}</Cite>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.65,
                color: 'var(--v2-fg-mute)',
                marginTop: 12,
              }}
            >
              Os 8 itens são predominantemente materiais de construção pesada — cimento, aço,
              agregados e cerâmicos. Quer que eu calcule o ICMS ou agrupe por categoria?
            </div>

            <div
              style={{
                fontSize: 10,
                color: 'var(--v2-fg-dim)',
                marginTop: 10,
                fontFamily: 'var(--font-mono)',
              }}
            >
              14:34 · 3 fontes citadas · 1.2s
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, alignSelf: 'center', width: '100%', marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--v2-fg-dim)', marginBottom: 8, paddingLeft: 36 }}>
          Sugestões
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 36 }}>
          {[
            'Calcular ICMS desta nota',
            'Validar a chave de acesso',
            'Comparar com outras notas da Vega',
            'Listar por categoria',
          ].map((q) => (
            <button
              key={q}
              style={{
                background: 'transparent',
                border: '1px solid var(--v2-line)',
                color: 'var(--v2-fg-mute)',
                borderRadius: 999,
                padding: '5px 11px',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div style={{ padding: '12px 28px 16px', borderTop: '1px solid var(--v2-line)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--v2-surface)',
            border: '1px solid var(--v2-line-strong)',
            borderRadius: 9,
            padding: '8px 8px 8px 14px',
          }}
        >
          <Button variant="ghost" size="icon" title="Anexar">
            <Icon name="plus" size={14} />
          </Button>
          <input
            placeholder="Pergunte sobre esta nota…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--v2-fg)',
              fontSize: 13.5,
              fontFamily: 'inherit',
              height: 26,
            }}
          />
          <Kbd>↵</Kbd>
          <Button variant="primary" size="icon">
            <Icon name="send" size={12} />
          </Button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--v2-fg-dim)', marginTop: 6 }}>
          Respostas baseadas apenas nesta nota. Para perguntar sobre múltiplas notas, abra o{' '}
          <a href="#" style={{ color: 'var(--v2-fg-mute)' }}>
            Chat
          </a>
          .
        </div>
      </div>
    </div>
  </>
);

// ═══════════════════════════════════════════════════════════════════
// 05 · CHAT — multi-document context
// ═══════════════════════════════════════════════════════════════════

const HifiV2Chat = () => {
  const [docs, setDocs] = React.useState([
    { id: '117', t: 'NF-e', n: '0023117', emit: 'Construtora Vega LTDA', val: '184.520,00' },
    { id: '118', t: 'NF-e', n: '0023118', emit: 'Cimentos Itaú LTDA', val: '32.880,40' },
    { id: '116', t: 'NF-e', n: '0023116', emit: 'BP Incorporadora SA', val: '2.450.000,00' },
  ]);
  const remove = (id) => setDocs((d) => d.filter((x) => x.id !== id));

  return (
    <V2 style={{ display: 'flex', flexDirection: 'column' }}>
      <V2Topbar active="chat" />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>
        {/* context sidebar */}
        <aside
          style={{
            borderRight: '1px solid var(--v2-line)',
            background: 'var(--v2-surface)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--v2-line)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Contexto</h3>
              <span
                style={{ fontSize: 11, color: 'var(--v2-fg-dim)', fontFamily: 'var(--font-mono)' }}
              >
                {docs.length} {docs.length === 1 ? 'nota' : 'notas'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--v2-fg-dim)', lineHeight: 1.5 }}>
              O assistente responde com base apenas nestas notas.
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  margin: '2px 10px',
                  padding: '10px 12px',
                  background: 'var(--v2-bg)',
                  border: '1px solid var(--v2-line)',
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Badge
                  variant="secondary"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '2px 4px',
                    flexShrink: 0,
                  }}
                >
                  {d.t}
                </Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--v2-fg)',
                    }}
                  >
                    {d.n}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--v2-fg-mute)',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.emit}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--v2-fg-dim)',
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    R$ {d.val}
                  </div>
                </div>
                <button
                  onClick={() => remove(d.id)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--v2-fg-dim)',
                    cursor: 'pointer',
                    padding: 2,
                    flexShrink: 0,
                  }}
                >
                  <Icon name="x" size={11} />
                </button>
              </div>
            ))}

            <button
              style={{
                margin: '8px 10px',
                padding: '10px 12px',
                width: 'calc(100% - 20px)',
                background: 'transparent',
                border: '1px dashed var(--v2-line-strong)',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: 'var(--v2-fg-mute)',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={12} />
              Adicionar nota
            </button>
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--v2-line)' }}>
            <Button
              variant="ghost"
              size="sm"
              icon="trash"
              full
              style={{ justifyContent: 'flex-start' }}
            >
              Nova conversa
            </Button>
          </div>
        </aside>

        {/* chat thread */}
        <main style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              padding: '14px 32px',
              borderBottom: '1px solid var(--v2-line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 500, margin: 0, letterSpacing: '-0.015em' }}>
                Análise de fornecedor — Vega
              </h1>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--v2-fg-dim)',
                  marginTop: 4,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <span>Iniciada hoje, 10:24</span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    background: 'var(--v2-line-strong)',
                    borderRadius: 999,
                  }}
                />
                <span>{docs.length} notas no contexto</span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    background: 'var(--v2-line-strong)',
                    borderRadius: 999,
                  }}
                />
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                >
                  R$ 2.667.400,40 total
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="default" icon="download">
                Exportar conversa
              </Button>
              <Button variant="outline" size="icon">
                <Icon name="more" size={13} />
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 16px' }}>
            <div
              style={{
                maxWidth: 760,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar initials="ai" size={26} accent="var(--v2-surface-2)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--v2-fg-mute)', lineHeight: 1.65 }}>
                    Você selecionou {docs.length} notas. Posso comparar valores, agrupar por
                    emissor, calcular impostos consolidados ou identificar duplicatas. O que
                    precisa?
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div
                    style={{
                      background: 'var(--v2-surface-2)',
                      border: '1px solid var(--v2-line-strong)',
                      borderRadius: '10px 10px 2px 10px',
                      padding: '9px 13px',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: 'var(--v2-fg)',
                    }}
                  >
                    Quais notas têm valor acima de R$ 100k? Liste em ordem decrescente.
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--v2-fg-dim)',
                      textAlign: 'right',
                      marginTop: 4,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    10:26
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar initials="ai" size={26} accent="var(--v2-surface-2)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--v2-fg)' }}>
                    Duas das três notas estão acima de R$ 100k:
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      border: '1px solid var(--v2-line)',
                      borderRadius: 8,
                      background: 'var(--v2-surface)',
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: 'var(--v2-surface-2)' }}>
                          {['Nota', 'Emissor', 'Valor', 'Data'].map((h, i) => (
                            <th
                              key={h}
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: 'var(--v2-fg-dim)',
                                textAlign: i === 2 ? 'right' : 'left',
                                padding: '8px 12px',
                                borderBottom: '1px solid var(--v2-line)',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['NF-e 0023116', 'BP Incorporadora SA', '2.450.000,00', 'ontem'],
                          ['NF-e 0023117', 'Construtora Vega LTDA', '184.520,00', 'hoje'],
                        ].map((r, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: i < 1 ? '1px solid var(--v2-line)' : 0 }}
                          >
                            <td
                              style={{
                                padding: '8px 12px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {r[0]}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{r[1]}</td>
                            <td
                              style={{
                                padding: '8px 12px',
                                textAlign: 'right',
                                fontFamily: 'var(--font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                color: 'var(--v2-copper)',
                                fontWeight: 500,
                              }}
                            >
                              R$ {r[2]}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--v2-fg-mute)' }}>
                              {r[3]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--v2-fg-mute)',
                      marginTop: 12,
                    }}
                  >
                    Juntas representam{' '}
                    <strong style={{ color: 'var(--v2-fg)', fontFamily: 'var(--font-mono)' }}>
                      R$ 2.634.520,00
                    </strong>{' '}
                    (≈98,8% do total selecionado). A NF-e 0023118 (R$ 32.880,40) ficou abaixo do
                    limite.
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    <Badge variant="secondary">
                      <Icon name="fileText" size={10} />
                      NF-e 0023116
                    </Badge>
                    <Badge variant="secondary">
                      <Icon name="fileText" size={10} />
                      NF-e 0023117
                    </Badge>
                    <Badge variant="secondary">
                      <Icon name="fileText" size={10} />
                      NF-e 0023118
                    </Badge>
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--v2-fg-dim)',
                      marginTop: 10,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    10:26 · 3 fontes · 1.4s
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 38 }}>
                <div style={{ fontSize: 11, color: 'var(--v2-fg-dim)', marginBottom: 8 }}>
                  Continuar com
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Comparar ICMS entre as duas',
                    'Quem é o destinatário em cada uma?',
                    'Agrupar itens por categoria',
                    'Listar fornecedores únicos',
                  ].map((q) => (
                    <button
                      key={q}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--v2-line)',
                        color: 'var(--v2-fg-mute)',
                        borderRadius: 999,
                        padding: '5px 11px',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 32px 18px', borderTop: '1px solid var(--v2-line)' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--v2-surface)',
                  border: '1px solid var(--v2-line-strong)',
                  borderRadius: 10,
                  padding: '10px 8px 10px 14px',
                }}
              >
                <Button variant="ghost" size="icon" title="Anexar nota">
                  <Icon name="plus" size={14} />
                </Button>
                <input
                  placeholder="Pergunte sobre as notas selecionadas…"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 0,
                    outline: 'none',
                    color: 'var(--v2-fg)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    height: 28,
                  }}
                />
                <Kbd>↵</Kbd>
                <Button variant="primary" size="icon">
                  <Icon name="send" size={12} />
                </Button>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--v2-fg-dim)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="fileText" size={11} />
                  Contexto: {docs.length} notas selecionadas
                </span>
                <span>GPT-4o · Function calling ativo</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </V2>
  );
};
Object.assign(window, { HifiV2Login, HifiV2List, HifiV2Upload, HifiV2Detail, HifiV2Chat });
