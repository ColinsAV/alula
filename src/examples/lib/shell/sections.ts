import AltRouteIcon from "@mui/icons-material/AltRoute";
import AnimationIcon from "@mui/icons-material/Animation";
import ArticleIcon from "@mui/icons-material/Article";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LayersIcon from "@mui/icons-material/Layers";
import MemoryIcon from "@mui/icons-material/Memory";
import PaletteIcon from "@mui/icons-material/Palette";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import type { IconData } from "../../../index";

/** Une section du catalogue : menu latéral, cartes de l'accueil. */
export interface Section {
  route: string;
  label: string;
  description: string;
  icon: IconData;
}

export const SECTIONS: Section[] = [
  { route: "/layout", label: "Mise en page", description: "Container, Row, Column, alignements, Wrap, Stack.", icon: ViewQuiltIcon },
  { route: "/material", label: "Material", description: "Boutons, champs, listes déroulantes, cases, curseurs.", icon: SmartButtonIcon },
  { route: "/lists", label: "Listes", description: "ListView.builder virtualisé, GridView responsive.", icon: ViewListIcon },
  { route: "/navigation", label: "Navigation", description: "push, pushNamed, paramètres d'URL, onglets.", icon: AltRouteIcon },
  { route: "/popups", label: "Pop-up", description: "Dialogs, bottom sheet, SnackBar.", icon: LayersIcon },
  { route: "/animations", label: "Animations", description: "AnimatedContainer, AnimatedSwitcher, courbes…", icon: AnimationIcon },
  { route: "/state", label: "État", description: "StatefulWidget, ChangeNotifier, Provider.", icon: MemoryIcon },
  { route: "/data", label: "Données", description: "FutureBuilder et static load.", icon: CloudDownloadIcon },
  { route: "/blog", label: "Blog", description: "Un mini-blog chargé côté serveur.", icon: ArticleIcon },
  { route: "/theme", label: "Thème", description: "Theme.of, mode sombre, MediaQuery.", icon: PaletteIcon },
];
