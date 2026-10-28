import {
  type IconData,
  Icons,
} from "../../../index";

/** Une section du catalogue : menu latéral, cartes de l'accueil. */
export interface Section {
  route: string;
  label: string;
  description: string;
  icon: IconData;
}

export const SECTIONS: Section[] = [
  { route: "/layout", label: "Mise en page", description: "Container, Row, Column, alignements, Wrap, Stack.", icon: Icons.view_quilt },
  { route: "/material", label: "Material", description: "Boutons, champs, listes déroulantes, cases, curseurs.", icon: Icons.smart_button },
  { route: "/lists", label: "Listes", description: "ListView.builder virtualisé, GridView responsive.", icon: Icons.view_list },
  { route: "/navigation", label: "Navigation", description: "push, pushNamed, paramètres d'URL, onglets.", icon: Icons.alt_route },
  { route: "/popups", label: "Pop-up", description: "Dialogs, bottom sheet, SnackBar.", icon: Icons.layers },
  { route: "/animations", label: "Animations", description: "AnimatedContainer, AnimatedSwitcher, courbes…", icon: Icons.animation },
  { route: "/state", label: "État", description: "StatefulWidget, ChangeNotifier, Provider.", icon: Icons.memory },
  { route: "/data", label: "Données", description: "FutureBuilder et static load.", icon: Icons.cloud_download },
  { route: "/blog", label: "Blog", description: "Un mini-blog chargé côté serveur.", icon: Icons.article },
  { route: "/theme", label: "Thème", description: "Theme.of, mode sombre, MediaQuery.", icon: Icons.palette },
];
