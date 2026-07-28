const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const publicPages={
  "index.html":"Pal Forge | Ferramentas comunitárias para Palworld",
  "palpedia.html":"Palpedia | Pal Forge",
  "pal.html":"Pal | Pal Forge",
  "breeding.html":"Calculadora de Breeding | Pal Forge",
  "reverso.html":"Mutação Reversa | Pal Forge",
  "caminho.html":"Caminho de Breeding | Pal Forge",
  "mapa.html":"Mapa Interativo | Pal Forge",
  "itens.html":"Itens e Drops | Pal Forge",
  "item.html":"Item | Pal Forge",
  "partner-skills.html":"Partner Skills | Pal Forge",
  "team-builder.html":"Team Builder | Pal Forge",
  "tierlist.html":"Rankings | Pal Forge",
  "comparador.html":"Comparador de Combate | Pal Forge",
  "comparador-trabalho.html":"Comparador de Trabalho | Pal Forge",
  "sobre.html":"Sobre | Pal Forge",
  "contato.html":"Contato | Pal Forge",
  "aviso-legal.html":"Aviso Legal | Pal Forge"
};
for(const [file,title] of Object.entries(publicPages)){
  const html=read(file);
  assert(html.includes(`<title>${title}</title>`),`Título incorreto: ${file}`);
  for(const marker of ['name="description"','rel="canonical"','property="og:title"','property="og:description"','property="og:url"','property="og:image"','name="twitter:card"','name="twitter:title"','name="twitter:description"','name="twitter:image"','rel="manifest"']) assert(html.includes(marker),`Metadado ausente em ${file}: ${marker}`);
  assert(html.includes('https://palforge.com.br'),`Domínio canônico ausente: ${file}`);
  assert(!html.includes('Pal Mutation Explorer'),`Marca antiga exposta: ${file}`);
  assert(html.includes('favicon.ico')&&html.includes('pal-forge-16x16.png')&&html.includes('pal-forge-32x32.png'),`Favicons ausentes: ${file}`);
}
const core=read('core.js');
assert(core.includes('className="site-brand"')&&core.includes('<span>Pal Forge</span>'));
assert(core.includes('Versão v1.0.0'));
assert(core.includes('sobre.html')&&core.includes('contato.html')&&core.includes('aviso-legal.html'));
const home=read('index.html');
assert(home.includes('<h1>Pal Forge</h1>'));
assert(home.includes('Ferramentas comunitárias para Palworld'));
for(const href of ['palpedia.html','breeding.html','mapa.html']) assert(home.includes(`href="${href}"`));
const i18n=read('i18n.js');
assert(i18n.includes('Community Tools for Palworld'));
assert(i18n.includes('Version v1.0.0'));
const cname=read('CNAME').trim(); assert.strictEqual(cname,'palforge.com.br');
const robots=read('robots.txt'); assert(robots.includes('Sitemap: https://palforge.com.br/sitemap.xml')); assert(robots.includes('Disallow: /mapa-lab.html'));
const sitemap=read('sitemap.xml'); for(const page of Object.keys(publicPages).filter(x=>!['pal.html','item.html'].includes(x))) assert(sitemap.includes(page==='index.html'?'https://palforge.com.br/':`https://palforge.com.br/${page}`)); for(const excluded of ['mapa-lab.html','auditoria.html','LOCAL_RESEARCH','worker-finder.html']) assert(!sitemap.includes(excluded));
const manifest=JSON.parse(read('site.webmanifest')); assert.strictEqual(manifest.name,'Pal Forge'); assert.strictEqual(manifest.start_url,'/'); assert.strictEqual(manifest.display,'standalone');
for(const asset of ['favicon.ico','assets/brand/pal-forge-16x16.png','assets/brand/pal-forge-32x32.png','assets/brand/pal-forge-180x180.png','assets/brand/pal-forge-social.png']) assert(fs.existsSync(path.join(root,asset)),`Asset ausente: ${asset}`);
function pngSize(file){const b=fs.readFileSync(path.join(root,file)); assert.strictEqual(b.toString('ascii',1,4),'PNG'); return [b.readUInt32BE(16),b.readUInt32BE(20)];}
assert.deepStrictEqual(pngSize('assets/brand/pal-forge-social.png'),[1200,630]);
assert.deepStrictEqual(pngSize('assets/brand/pal-forge-32x32.png'),[32,32]);
const notFound=read('404.html'); assert(notFound.includes('Página não encontrada')); for(const page of ['index.html','palpedia.html','mapa.html']) assert(notFound.includes(page));
for(const legacy of ['auditoria.html','enciclopedia.html','impossiveis.html','tiertrabalho.html','worker-finder.html']) assert(read(legacy).includes('location.replace'));
console.log('launch brand: identity, metadata, SEO and legacy URLs approved');
