"use server";

// Fausse base de données : en vrai, un appel à une base, un CMS ou une API.
//
// "use server" : ce module reste sur le serveur. Les pages l'importent (pour
// leur `static load`), mais le navigateur ne reçoit qu'une référence, pas ce
// code ni ses dépendances (client de base de données, secrets…). Seules des
// fonctions async peuvent être exportées, et chacune devient appelable depuis
// le navigateur : n'y mettez que des lectures de données publiques.

export interface Article {
  slug: string;
  title: string;
  summary: string;
  body: string;
  /** Date en texte : les données doivent être sérialisables (pas de Date). */
  publishedAt: string;
}

const ARTICLES: Article[] = [
  {
    slug: "premier-article",
    title: "La syntaxe Flutter, le SEO de Next.js",
    summary: "Pourquoi écrire des widgets qui deviennent un vrai site Next.",
    body: "Les pages sont des widgets. La CLI génère l'app Next dans .better/, et chaque page est rendue côté serveur avec ses données.",
    publishedAt: "2026-10-01",
  },
  {
    slug: "static-load",
    title: "Charger les données côté serveur",
    summary: "static load : le contenu arrive dans le HTML, Google le voit.",
    body: "Une page déclare static load. Le serveur l'exécute avant de construire le HTML ; en navigation, une Server Action l'exécute sur le serveur.",
    publishedAt: "2026-10-20",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getArticles(): Promise<Article[]> {
  await delay(300); // simule la latence d'une vraie base
  return ARTICLES;
}

export async function getArticle(slug: string): Promise<Article | null> {
  await delay(300);
  return ARTICLES.find((article) => article.slug === slug) ?? null;
}
