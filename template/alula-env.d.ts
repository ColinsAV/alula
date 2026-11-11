// Types des images importées dans le code : `import hero from "./hero.jpg"`,
// à passer à `Image.asset(hero)`.
type AlulaStaticImage = { src: string; width: number; height: number; blurDataURL?: string };

declare module "*.png" { const image: AlulaStaticImage; export default image; }
declare module "*.jpg" { const image: AlulaStaticImage; export default image; }
declare module "*.jpeg" { const image: AlulaStaticImage; export default image; }
declare module "*.gif" { const image: AlulaStaticImage; export default image; }
declare module "*.webp" { const image: AlulaStaticImage; export default image; }
declare module "*.avif" { const image: AlulaStaticImage; export default image; }
