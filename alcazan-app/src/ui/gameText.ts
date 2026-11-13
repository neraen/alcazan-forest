/**
 * Les textes joueur sont générés CÔTÉ BACK, en français, et contiennent du HTML :
 * `<br/>` pour les retours ligne, parfois `<b>`/`<span>`. Le web les rend par
 * `dangerouslySetInnerHTML` ; en React Native il n'existe pas d'équivalent.
 *
 * Point UNIQUE de conversion : les `<br>` deviennent des retours ligne, le reste des
 * balises disparaît, les entités courantes sont décodées. Ne jamais analyser ces chaînes
 * ailleurs — ce sont des phrases interpolées, et en tirer de la donnée structurée
 * produirait de la FAUSSE donnée (même constat que pour la table `historique`, doc §21.12).
 */
export function renderGameText(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
