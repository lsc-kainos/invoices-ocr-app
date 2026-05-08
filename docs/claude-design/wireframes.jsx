// wireframes.jsx — low-fi grayscale wireframes for the same 4 screens

const W = ({ children, h = 8, w = '100%', style }) => (
  <div className="wline" style={{ height: h, width: w, ...style }}>
    {children}
  </div>
);
const Wbox = ({ children, style, dashed = true }) => (
  <div
    style={{
      border: `1px ${dashed ? 'dashed' : 'solid'} var(--wire-line)`,
      borderRadius: 4,
      padding: 8,
      ...style,
    }}
  >
    {children}
  </div>
);
const Wlabel = ({ children, size = 10, style }) => (
  <div
    style={{
      fontSize: size,
      color: 'var(--wire-fg)',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.04em',
      ...style,
    }}
  >
    {children}
  </div>
);
const Wbtn = ({ fill, children, style }) => (
  <div
    className={`wbtn ${fill ? 'wbtn-fill' : ''}`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      ...style,
    }}
  >
    {children}
  </div>
);

const WireSidebar = () => (
  <aside
    style={{
      width: 180,
      flex: '0 0 180px',
      borderRight: '1px solid var(--wire-line)',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      background: 'oklch(0.07 0 0)',
    }}
  >
    <Wbox style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--wire-line)' }} />
      <Wlabel>logo / brand</Wlabel>
    </Wbox>
    <Wbox style={{ padding: 6 }}>
      <Wlabel size={9}>{'> buscar...'}</Wlabel>
    </Wbox>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Wlabel size={9} style={{ textTransform: 'uppercase', opacity: 0.6 }}>
        workspace
      </Wlabel>
      {['Visão geral', 'Documentos', 'Novo upload'].map((t, i) => (
        <div
          key={t}
          style={{
            padding: '8px 10px',
            borderRadius: 4,
            border: i === 1 ? '1px solid var(--wire-fg)' : '1px dashed var(--wire-line)',
            background: i === 1 ? 'oklch(0.18 0 0)' : 'transparent',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--wire-fg)',
          }}
        >
          {t}
        </div>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <Wbox style={{ padding: 10 }}>
      <Wlabel size={9}>storage / user</Wlabel>
      <W h={4} style={{ marginTop: 8, background: 'var(--wire-line)' }} />
    </Wbox>
  </aside>
);

const WireTopBar = ({ items = ['Documentos'] }) => (
  <header
    style={{
      height: 44,
      padding: '0 16px',
      borderBottom: '1px solid var(--wire-line)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <Wlabel>{items.join('  ›  ')}</Wlabel>
    <div style={{ flex: 1 }} />
    <Wbtn>filtrar</Wbtn>
    <Wbtn fill>+ novo upload</Wbtn>
  </header>
);

// 1. Login wireframe
const WireLogin = () => (
  <div className="frame wire" data-screen-label="WF · Login">
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Wbox style={{ width: 90, padding: '14px 16px', textAlign: 'center' }}>
            <Wlabel>logo</Wlabel>
          </Wbox>
        </div>
        <Wbox style={{ padding: 12 }}>
          <Wlabel size={11} style={{ textAlign: 'center' }}>
            título — bem-vindo
          </Wlabel>
          <W
            h={5}
            style={{
              marginTop: 8,
              opacity: 0.5,
              width: '80%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
          <W
            h={5}
            style={{
              marginTop: 4,
              opacity: 0.5,
              width: '60%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
        </Wbox>
        <Wbox style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: '1px dashed var(--wire-line)',
            }}
          />
          <Wlabel>botão · OAuth Google</Wlabel>
        </Wbox>
        <Wbox style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: '1px dashed var(--wire-line)',
            }}
          />
          <Wlabel>botão · OAuth GitHub</Wlabel>
        </Wbox>
        <Wlabel size={9} style={{ textAlign: 'center', opacity: 0.6 }}>
          rodapé · termos · privacidade · LGPD
        </Wlabel>
      </div>
    </div>
    <div
      style={{
        width: 280,
        flex: '0 0 280px',
        borderLeft: '1px solid var(--wire-line)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'oklch(0.07 0 0)',
      }}
    >
      <Wlabel size={9} style={{ textTransform: 'uppercase', opacity: 0.6 }}>
        marketing rail
      </Wlabel>
      <Wbox style={{ padding: 14 }}>
        <W h={10} style={{ marginBottom: 8 }} />
        <W h={10} style={{ marginBottom: 8, width: '85%' }} />
        <W h={10} style={{ width: '60%' }} />
      </Wbox>
      <Wbox style={{ padding: 10 }}>
        <Wlabel size={9}>· feature 1</Wlabel>
      </Wbox>
      <Wbox style={{ padding: 10 }}>
        <Wlabel size={9}>· feature 2</Wlabel>
      </Wbox>
      <Wbox style={{ padding: 10 }}>
        <Wlabel size={9}>· feature 3</Wlabel>
      </Wbox>
    </div>
  </div>
);

// 2. List wireframe
const WireList = () => (
  <div className="frame wire" data-screen-label="WF · Lista">
    <WireSidebar />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <WireTopBar items={['Documentos']} />
      <div
        style={{
          flex: 1,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <W h={16} w={180} style={{ marginBottom: 6 }} />
            <Wlabel size={10} style={{ opacity: 0.6 }}>
              subtítulo · resumo
            </Wlabel>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Wbtn>todos</Wbtn>
            <Wbtn>nf-e</Wbtn>
            <Wbtn>nfs-e</Wbtn>
            <Wbtn>boletos</Wbtn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <Wbox key={i} style={{ padding: 12, height: 70 }}>
              <Wlabel size={9} style={{ opacity: 0.6, textTransform: 'uppercase' }}>
                kpi {i}
              </Wlabel>
              <W h={14} w="60%" style={{ marginTop: 6 }} />
            </Wbox>
          ))}
        </div>

        <Wbox style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.4fr 1fr 0.8fr 0.7fr 60px',
              padding: '8px 12px',
              borderBottom: '1px dashed var(--wire-line)',
              background: 'oklch(0.1 0 0)',
            }}
          >
            {['Documento', 'Fornecedor', 'Data', 'Total', 'Status', ''].map((h) => (
              <Wlabel key={h} size={9} style={{ textTransform: 'uppercase', opacity: 0.6 }}>
                {h}
              </Wlabel>
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.4fr 1fr 0.8fr 0.7fr 60px',
                padding: '12px',
                borderBottom: i < 6 ? '1px dashed var(--wire-line)' : 'none',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div
                  style={{
                    width: 24,
                    height: 30,
                    border: '1px dashed var(--wire-line)',
                    borderRadius: 3,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <W h={6} w="80%" style={{ marginBottom: 4 }} />
                  <W h={5} w="40%" style={{ opacity: 0.5 }} />
                </div>
              </div>
              <W h={6} w="70%" />
              <W h={6} w="60%" />
              <W h={6} w="50%" />
              <Wbtn style={{ fontSize: 9 }}>● status</Wbtn>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: '1px dashed var(--wire-line)',
                    borderRadius: 3,
                  }}
                />
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: '1px dashed var(--wire-line)',
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </Wbox>
      </div>
    </main>
  </div>
);

// 3. Upload wireframe
const WireUpload = () => (
  <div className="frame wire" data-screen-label="WF · Upload">
    <WireSidebar />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <WireTopBar items={['Documentos', 'Novo upload']} />
      <div
        style={{
          flex: 1,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <W h={16} w={180} style={{ marginBottom: 6 }} />
            <Wlabel size={10} style={{ opacity: 0.6 }}>
              jpg · png · pdf · 10mb max
            </Wlabel>
          </div>
          <Wbox
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              border: '1.5px dashed var(--wire-line)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: '1px dashed var(--wire-line)',
                borderRadius: 8,
              }}
            />
            <Wlabel>arraste arquivos aqui</Wlabel>
            <Wlabel size={9} style={{ opacity: 0.6 }}>
              ou clique para selecionar
            </Wlabel>
            <Wbtn fill>+ selecionar</Wbtn>
          </Wbox>

          <div>
            <Wlabel size={10} style={{ marginBottom: 8, textTransform: 'uppercase', opacity: 0.6 }}>
              em andamento — 3 arquivos
            </Wlabel>
            <Wbox style={{ padding: 0 }}>
              {[
                { pct: 76, stage: 'extraindo' },
                { pct: 42, stage: 'enviando' },
                { pct: 100, stage: 'concluído' },
              ].map((f, i, a) => (
                <div
                  key={i}
                  style={{
                    padding: 10,
                    borderBottom: i < a.length - 1 ? '1px dashed var(--wire-line)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: '1px dashed var(--wire-line)',
                      borderRadius: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}
                    >
                      <W h={6} w={120} />
                      <Wlabel size={9}>{f.pct}%</Wlabel>
                    </div>
                    <div
                      style={{
                        height: 3,
                        border: '1px dashed var(--wire-line)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{ width: `${f.pct}%`, height: '100%', background: 'var(--wire-fg)' }}
                      />
                    </div>
                    <Wlabel size={9} style={{ marginTop: 4, opacity: 0.6 }}>
                      {f.stage}
                    </Wlabel>
                  </div>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: '1px dashed var(--wire-line)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              ))}
            </Wbox>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Wbox style={{ padding: 14 }}>
            <Wlabel size={10} style={{ textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>
              o que extraímos
            </Wlabel>
            {['CNPJ', 'Chave NF-e', 'CFOP', 'Valor total', 'Data emissão', 'Itens'].map((t) => (
              <div
                key={t}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px dashed var(--wire-line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Wlabel size={10}>{t}</Wlabel>
                <Wlabel size={9} style={{ opacity: 0.5 }}>
                  tipo
                </Wlabel>
              </div>
            ))}
          </Wbox>
          <Wbox style={{ padding: 14 }}>
            <Wlabel size={10} style={{ textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>
              segurança / lgpd
            </Wlabel>
            <W h={5} style={{ marginBottom: 5, opacity: 0.6 }} />
            <W h={5} style={{ marginBottom: 5, width: '85%', opacity: 0.6 }} />
            <W h={5} style={{ marginBottom: 5, width: '70%', opacity: 0.6 }} />
            <W h={5} style={{ width: '90%', opacity: 0.6 }} />
          </Wbox>
        </div>
      </div>
    </main>
  </div>
);

// 4. Detail wireframe
const WireDetail = () => (
  <div className="frame wire" data-screen-label="WF · Detalhe">
    <WireSidebar />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <WireTopBar items={['Documentos', 'NF-e 000.142.871']} />
      {/* doc header strip */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wire-line)' }}>
        <W h={14} w={220} style={{ marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 14 }}>
          <Wlabel size={9} style={{ opacity: 0.6 }}>
            cnpj · ...
          </Wlabel>
          <Wlabel size={9} style={{ opacity: 0.6 }}>
            data · ...
          </Wlabel>
          <Wlabel size={9} style={{ opacity: 0.6 }}>
            total · ...
          </Wlabel>
        </div>
      </div>

      {/* image pane */}
      <section
        style={{
          flex: '0 0 46%',
          borderBottom: '1px solid var(--wire-line)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            height: 36,
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px dashed var(--wire-line)',
          }}
        >
          <Wlabel size={9}>página 1/1</Wlabel>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {['zoom-', '100%', 'zoom+', 'rot', 'eye'].map((t) => (
              <div
                key={t}
                style={{
                  padding: '2px 6px',
                  border: '1px dashed var(--wire-line)',
                  borderRadius: 3,
                  fontSize: 9,
                  color: 'var(--wire-fg)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Wbox
            style={{
              width: 380,
              aspectRatio: '1.4/1',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <W h={6} w="80%" />
            <W h={6} w="60%" style={{ opacity: 0.6 }} />
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: 6,
                marginTop: 4,
              }}
            >
              <Wbox style={{ padding: 6 }}>
                <W h={5} style={{ marginBottom: 4 }} />
                <W h={5} w="80%" style={{ opacity: 0.5, marginBottom: 4 }} />
                <W h={5} w="60%" style={{ opacity: 0.5 }} />
              </Wbox>
              <Wbox style={{ padding: 6 }}>
                <W h={5} style={{ marginBottom: 4, opacity: 0.6 }} />
                <W h={5} w="70%" style={{ opacity: 0.5 }} />
              </Wbox>
            </div>
            <Wlabel
              size={8}
              style={{
                textAlign: 'center',
                opacity: 0.5,
                padding: '4px 0',
                border: '1px dashed var(--wire-line)',
                borderRadius: 2,
              }}
            >
              chave de acesso · 44 dígitos
            </Wlabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <Wbox key={i} style={{ padding: 4 }}>
                  <W h={4} style={{ opacity: 0.6 }} />
                  <W h={5} w="70%" style={{ marginTop: 3 }} />
                </Wbox>
              ))}
            </div>
            <Wbox style={{ flex: 1, padding: 6 }}>
              <Wlabel size={8} style={{ opacity: 0.6, marginBottom: 4 }}>
                itens · descrição
              </Wlabel>
              {[1, 2, 3].map((i) => (
                <W key={i} h={5} style={{ marginBottom: 4, opacity: 0.5 }} />
              ))}
            </Wbox>
          </Wbox>
        </div>
      </section>

      {/* bottom split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* fields/text */}
        <section style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              height: 36,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: '1px dashed var(--wire-line)',
            }}
          >
            <div
              style={{
                padding: '4px 8px',
                border: '1px solid var(--wire-fg)',
                borderRadius: 3,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: 'var(--wire-fg)',
              }}
            >
              campos br
            </div>
            <div
              style={{
                padding: '4px 8px',
                border: '1px dashed var(--wire-line)',
                borderRadius: 3,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                opacity: 0.6,
              }}
            >
              texto bruto
            </div>
            <div
              style={{
                padding: '4px 8px',
                border: '1px dashed var(--wire-line)',
                borderRadius: 3,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                opacity: 0.6,
              }}
            >
              metadados
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: 14,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Wlabel size={9} style={{ textTransform: 'uppercase', opacity: 0.6 }}>
              identificação
            </Wlabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Wbox key={i} style={{ padding: 8 }}>
                  <Wlabel size={8} style={{ opacity: 0.6, marginBottom: 4 }}>
                    campo {i}
                  </Wlabel>
                  <W h={6} w="70%" />
                </Wbox>
              ))}
            </div>
            <Wlabel size={9} style={{ textTransform: 'uppercase', opacity: 0.6, marginTop: 4 }}>
              chave de acesso
            </Wlabel>
            <Wbox style={{ padding: 10 }}>
              <W h={6} style={{ marginBottom: 4 }} />
              <W h={4} w="80%" style={{ opacity: 0.5 }} />
            </Wbox>
            <Wlabel size={9} style={{ textTransform: 'uppercase', opacity: 0.6, marginTop: 4 }}>
              itens (3)
            </Wlabel>
            <Wbox style={{ padding: 0 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    borderBottom: i < 3 ? '1px dashed var(--wire-line)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 60px 80px',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <Wlabel size={9}>{i.toString().padStart(3, '0')}</Wlabel>
                  <W h={6} />
                  <W h={6} style={{ opacity: 0.5 }} />
                  <W h={6} w="70%" />
                </div>
              ))}
            </Wbox>
          </div>
        </section>

        {/* chat */}
        <section
          style={{
            flex: '1 1 40%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--wire-line)',
            minWidth: 0,
          }}
        >
          <div
            style={{
              height: 36,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px dashed var(--wire-line)',
            }}
          >
            <Wlabel size={10}>● assistente — gpt-4o</Wlabel>
          </div>
          <div
            style={{
              flex: 1,
              padding: 12,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[
              { user: false, lines: 3 },
              { user: true, lines: 1 },
              { user: false, lines: 4 },
              { user: true, lines: 2 },
            ].map((m, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 8, flexDirection: m.user ? 'row-reverse' : 'row' }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: '1px dashed var(--wire-line)',
                    flex: '0 0 22px',
                  }}
                />
                <Wbox style={{ padding: 8, maxWidth: '78%' }}>
                  {Array.from({ length: m.lines }).map((_, j) => (
                    <W
                      key={j}
                      h={5}
                      w={j === m.lines - 1 ? '60%' : '100%'}
                      style={{ marginBottom: j < m.lines - 1 ? 4 : 0, opacity: 0.6 }}
                    />
                  ))}
                </Wbox>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 12px 8px', display: 'flex', gap: 4 }}>
            <Wbtn>sugestão 1</Wbtn>
            <Wbtn>sugestão 2</Wbtn>
          </div>
          <div style={{ padding: '10px 12px 12px', borderTop: '1px dashed var(--wire-line)' }}>
            <Wbox style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wlabel size={10} style={{ flex: 1, opacity: 0.5 }}>
                {'> pergunte sobre o documento...'}
              </Wlabel>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '1px solid var(--wire-fg)',
                  borderRadius: 4,
                }}
              />
            </Wbox>
          </div>
        </section>
      </div>
    </main>
  </div>
);

Object.assign(window, { WireLogin, WireList, WireUpload, WireDetail });
