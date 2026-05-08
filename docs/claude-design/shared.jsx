// shared.jsx — primitives reused across all screens

const Icon = ({ name, size = 16, stroke = 1.6, style }) => {
  const paths = {
    upload: (
      <>
        <path d="M12 16V4M12 4l-5 5M12 4l5 5" />
        <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
        <path d="M14 3v5h5" />
      </>
    ),
    fileText: (
      <>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </>
    ),
    home: (
      <>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.5-4.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.6 1.6 0 00.3 1.7l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.4 1.6 1.6 0 00-1.7.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.4-1 1.6 1.6 0 00-.3-1.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.7.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.7-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.7V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    chevronDown: (
      <>
        <path d="M6 9l6 6 6-6" />
      </>
    ),
    chevronRight: (
      <>
        <path d="M9 6l6 6-6 6" />
      </>
    ),
    chevronLeft: (
      <>
        <path d="M15 6l-6 6 6 6" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </>
    ),
    send: (
      <>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
        <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" />
      </>
    ),
    zoomIn: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.5-4.5M11 8v6M8 11h6" />
      </>
    ),
    zoomOut: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.5-4.5M8 11h6" />
      </>
    ),
    rotate: (
      <>
        <path d="M21 12a9 9 0 11-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </>
    ),
    check: (
      <>
        <path d="M5 12l5 5L20 7" />
      </>
    ),
    x: (
      <>
        <path d="M18 6L6 18M6 6l12 12" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      </>
    ),
    filter: (
      <>
        <path d="M3 4h18l-7 9v6l-4 2v-8z" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </>
    ),
    arrowLeft: (
      <>
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0116 0" />
      </>
    ),
    logo: (
      <>
        <path d="M5 19V5h6a4 4 0 010 8H8" />
        <path d="M14 19l4-7 4 7" />
        <path d="M16.5 16h3" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    moon: (
      <>
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {paths[name]}
    </svg>
  );
};

// Brand mark — wordmark using Instrument Serif
const Brand = ({ size = 18 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <div
      style={{
        width: size + 8,
        height: size + 8,
        borderRadius: 6,
        background:
          'linear-gradient(135deg, var(--primary), oklch(from var(--primary) calc(l - 0.1) c h))',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--primary-foreground)',
        fontFamily: 'var(--font-serif)',
        fontSize: size,
        fontStyle: 'italic',
        letterSpacing: '-0.02em',
        boxShadow: 'inset 0 1px 0 oklch(from var(--primary) calc(l + 0.15) c h / 0.5)',
      }}
    >
      p
    </div>
    <div
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: size + 4,
        fontStyle: 'italic',
        letterSpacing: '-0.015em',
        color: 'var(--foreground)',
      }}
    >
      invoices<span style={{ color: 'var(--ring)' }}>.</span>app
    </div>
  </div>
);

// Logos for OAuth
const GoogleLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3a12 12 0 11-3.4-12.6l5.7-5.7A20 20 0 1044 24a20 20 0 00-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8A12 12 0 0124 12a12 12 0 017.9 3l5.7-5.7A20 20 0 006.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44a20 20 0 0013.4-5.2l-6.2-5.2A12 12 0 0112.7 28l-6.5 5A20 20 0 0024 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8a20 20 0 00-.4-3.5z"
    />
  </svg>
);
const GithubLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2 0-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .5.3.8 1 .8 2v3c0 .3.2.7.8.6A12 12 0 0012 .3" />
  </svg>
);

// Sidebar — used across Dashboard, Upload, Detail
const Sidebar = ({ active = 'documents' }) => {
  const item = (key, icon, label, badge) => (
    <a
      href="#"
      data-active={active === key}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        color: active === key ? 'var(--foreground)' : 'var(--muted-foreground)',
        background: active === key ? 'var(--sidebar-accent)' : 'transparent',
        fontSize: 13,
        fontWeight: active === key ? 500 : 400,
        textDecoration: 'none',
      }}
    >
      <Icon name={icon} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            background: 'var(--secondary)',
            color: 'var(--muted-foreground)',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 999,
          }}
        >
          {badge}
        </span>
      )}
    </a>
  );

  return (
    <aside
      style={{
        width: 232,
        flex: '0 0 232px',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
        gap: 18,
      }}
    >
      <div style={{ padding: '2px 6px' }}>
        <Brand size={16} />
      </div>

      <div style={{ position: 'relative' }}>
        <Icon
          name="search"
          size={13}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)',
          }}
        />
        <input
          className="input"
          placeholder="Buscar documentos…"
          style={{
            paddingLeft: 30,
            height: 32,
            fontSize: 12,
            background: 'var(--sidebar-accent)',
            borderColor: 'transparent',
          }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
            padding: '8px 10px 4px',
          }}
        >
          Workspace
        </div>
        {item('dashboard', 'home', 'Visão geral')}
        {item('documents', 'fileText', 'Documentos', '24')}
        {item('upload', 'upload', 'Novo upload')}
      </nav>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
            padding: '8px 10px 4px',
          }}
        >
          Coleções
        </div>
        {item('nfe', 'file', 'NF-e')}
        {item('nfse', 'file', 'NFS-e')}
        {item('boletos', 'file', 'Boletos')}
      </nav>

      <div style={{ flex: 1 }}></div>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--sidebar-accent)',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--muted-foreground)' }}>Storage</span>
          <span className="mono">2.3 / 10 GB</span>
        </div>
        <div
          style={{
            height: 4,
            background: 'var(--secondary)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '23%', height: '100%', background: 'var(--ring)' }}></div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--primary-foreground)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            RC
          </div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Rafael C.</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>rafael@kainos…</div>
          </div>
          <Icon name="settings" size={14} style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </div>
    </aside>
  );
};

// Top header bar inside main content
const TopBar = ({ title, breadcrumb, actions }) => (
  <header
    style={{
      height: 56,
      padding: '0 24px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flex: '0 0 auto',
    }}
  >
    {breadcrumb ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--muted-foreground)',
        }}
      >
        {breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            <span
              style={{
                color:
                  i === breadcrumb.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
              }}
            >
              {b}
            </span>
            {i < breadcrumb.length - 1 && <Icon name="chevronRight" size={12} />}
          </React.Fragment>
        ))}
      </div>
    ) : (
      <h1 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{title}</h1>
    )}
    <div style={{ flex: 1 }}></div>
    {actions}
  </header>
);

Object.assign(window, { Icon, Brand, Sidebar, TopBar, GoogleLogo, GithubLogo });
