import { titleFromContent } from './title-from-content';

describe('titleFromContent', () => {
  it('retorna content quando ≤ 50 chars', () => {
    expect(titleFromContent('Olá mundo')).toBe('Olá mundo');
  });
  it('trunca em 50 chars com elipse', () => {
    const long = 'a'.repeat(60);
    const out = titleFromContent(long);
    expect(out).toBe('a'.repeat(50) + '…');
    expect(out.length).toBe(51);
  });
  it('trim antes de truncar', () => {
    expect(titleFromContent('  oi  ')).toBe('oi');
  });
});
