// Types des images importées dans le code : `import hero from "./hero.jpg"`,
// à passer à `Image.asset(hero)`.
type BetterStaticImage = { src: string; width: number; height: number; blurDataURL?: string };

declare module "*.png" { const image: BetterStaticImage; export default image; }
declare module "*.jpg" { const image: BetterStaticImage; export default image; }
declare module "*.jpeg" { const image: BetterStaticImage; export default image; }
declare module "*.gif" { const image: BetterStaticImage; export default image; }
declare module "*.webp" { const image: BetterStaticImage; export default image; }
declare module "*.avif" { const image: BetterStaticImage; export default image; }
