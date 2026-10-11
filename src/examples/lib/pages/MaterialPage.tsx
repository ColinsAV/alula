import AddIcon from "@mui/icons-material/Add";
import FavoriteIcon from "@mui/icons-material/Favorite";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WifiIcon from "@mui/icons-material/Wifi";
import {
  AlertDialog,
  Alignment,
  AppBar,
  BorderRadius,
  BoxDecoration,
  BoxFit,
  Card,
  Checkbox,
  CircularProgressIndicator,
  ClipRRect,
  Column,
  Container,
  CrossAxisAlignment,
  Divider,
  EdgeInsets,
  ElevatedButton,
  FloatingActionButton,
  FontWeight,
  GridView,
  Icon,
  IconButton,
  Image,
  LinearProgressIndicator,
  ListTile,
  ListView,
  MediaQuery,
  Padding,
  Positioned,
  Radio,
  ResponsiveLayout,
  Row,
  Scaffold,
  showDialog,
  showModalBottomSheet,
  showSnackBar,
  SimpleDialog,
  SimpleDialogOption,
  SizedBox,
  SnackBar,
  SnackBarAction,
  Slider,
  Stack,
  StatefulWidget,
  Switch,
  Text,
  TextButton,
  Theme as AppTheme,
  ThemeModeButton,
  Wrap,
} from "../../../index";

type Theme = "Clair" | "Sombre" | "Système";

const sectionTitle = (text: string) =>
  Padding({
    padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
    child: Text(text, { style: { fontSize: 16, fontWeight: FontWeight.w600 } }),
  });

export class MaterialPage extends StatefulWidget {
  static route = "/widgets/material";
  static metadata = () => ({
    title: "Widgets Material",
    description: "Scaffold, AppBar, Card, ListTile, Checkbox, Switch, Radio, Slider, Stack, GridView…",
  });

  private wifi = true;
  private notifications: boolean | null = null;
  private theme: Theme = "Système";
  private volume = 0.4;
  private likes = 0;

  override initState() {}

  private async confirmReset() {
    const confirmed = await showDialog<boolean>({
      builder: (close) =>
        AlertDialog({
          title: Text("Remettre à zéro ?"),
          content: Text(`Les ${this.likes} j'aime seront perdus.`),
          actions: [
            TextButton({ onPressed: () => close(false), child: "Annuler" }),
            TextButton({ onPressed: () => close(true), child: "Remettre à zéro" }),
          ],
        }),
    });
    if (!confirmed) return;
    const previous = this.likes;
    this.setState(() => { this.likes = 0; });
    showSnackBar(
      SnackBar({
        content: "J'aime remis à zéro",
        action: SnackBarAction({ label: "Annuler", onPressed: () => this.setState(() => { this.likes = previous; }) }),
      })
    );
  }

  private async chooseTheme() {
    const theme = await showDialog<Theme>({
      builder: (close) =>
        SimpleDialog({
          title: Text("Thème"),
          children: (["Clair", "Sombre", "Système"] as Theme[]).map((t) =>
            SimpleDialogOption({ onPressed: () => close(t), child: Text(t) })
          ),
        }),
    });
    if (theme) this.setState(() => { this.theme = theme; });
  }

  private openSheet() {
    showModalBottomSheet({
      builder: (close) =>
        Container({
          padding: EdgeInsets.all(24),
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Text("Bottom sheet", { style: { fontSize: 18, fontWeight: FontWeight.w600 } }),
              Text("Un panneau qui monte du bas de l'écran."),
              ElevatedButton({ onPressed: () => close(), child: "Fermer" }),
            ],
          }),
        }),
    });
  }

  override build() {
    const colors = AppTheme.of().colorScheme;
    const media = MediaQuery.of();
    const columns = { compact: 2, medium: 3, expanded: 4 }[media.windowSizeClass];

    return Scaffold({
      appBar: AppBar({
        title: Text("Widgets Material"),
        actions: [
          ThemeModeButton(),
          IconButton({
            icon: Icon(FavoriteIcon),
            tooltip: `${this.likes} j'aime`,
            onPressed: () => this.setState(() => { this.likes++; }),
          }),
        ],
      }),
      floatingActionButton: FloatingActionButton({
        tooltip: "J'aime",
        onPressed: () => this.setState(() => { this.likes++; }),
        child: Icon(AddIcon),
      }),
      body: ListView({
        children: [
          sectionTitle("Card + ListTile + contrôles"),
          Card({
            margin: EdgeInsets.symmetric({ horizontal: 16 }),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ListTile({
                  leading: Icon(WifiIcon),
                  title: "Wi-Fi",
                  subtitle: this.wifi ? "Connecté" : "Désactivé",
                  trailing: Switch({
                    value: this.wifi,
                    onChanged: (v) => this.setState(() => { this.wifi = v; }),
                  }),
                }),
                Divider(),
                ListTile({
                  leading: Icon(NotificationsIcon),
                  title: "Notifications",
                  subtitle: "Case à trois états (oui / non / indéterminé)",
                  trailing: Checkbox({
                    value: this.notifications,
                    tristate: true,
                    onChanged: (v) => this.setState(() => { this.notifications = v; }),
                  }),
                }),
                Divider(),
                ...(["Clair", "Sombre", "Système"] as Theme[]).map((theme) =>
                  ListTile({
                    title: theme,
                    onTap: () => this.setState(() => { this.theme = theme; }),
                    leading: Radio({
                      value: theme,
                      groupValue: this.theme,
                      onChanged: (t) => this.setState(() => { this.theme = t; }),
                    }),
                  })
                ),
              ],
            }),
          }),

          sectionTitle("Pop-up"),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            child: Wrap({
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton({ onPressed: () => this.confirmReset(), child: "AlertDialog + SnackBar" }),
                ElevatedButton({ onPressed: () => this.chooseTheme(), child: `SimpleDialog (${this.theme})` }),
                ElevatedButton({ onPressed: () => this.openSheet(), child: "Bottom sheet" }),
              ],
            }),
          }),

          sectionTitle("Image"),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            child: ClipRRect({
              borderRadius: BorderRadius.circular(12),
              child: Image.network("https://picsum.photos/seed/better/1200/400", {
                width: Infinity,
                height: 200,
                fit: BoxFit.cover,
                semanticLabel: "Photo d'exemple",
              }),
            }),
          }),

          sectionTitle("Responsive"),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 8,
              children: [
                Text(
                  `MediaQuery : ${media.size.width} × ${media.size.height} px, ${media.windowSizeClass}, ${media.orientation}`
                ),
                ResponsiveLayout({
                  compact: Text("ResponsiveLayout : téléphone 📱", { style: { color: colors.primary } }),
                  medium: Text("ResponsiveLayout : tablette", { style: { color: colors.primary } }),
                  expanded: Text("ResponsiveLayout : écran large 🖥️", { style: { color: colors.primary } }),
                }),
              ],
            }),
          }),

          sectionTitle(`Slider — volume ${Math.round(this.volume * 100)} %`),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 24 }),
            child: Slider({
              value: this.volume,
              divisions: 10,
              label: `${Math.round(this.volume * 100)} %`,
              onChanged: (v) => this.setState(() => { this.volume = v; }),
            }),
          }),

          sectionTitle("Indicateurs de progression"),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 16,
              children: [
                Row({
                  spacing: 24,
                  children: [CircularProgressIndicator(), CircularProgressIndicator({ value: this.volume })],
                }),
                LinearProgressIndicator(),
                LinearProgressIndicator({ value: this.volume, color: "#16a34a" }),
              ],
            }),
          }),

          sectionTitle("Stack + Positioned"),
          Container({
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            child: Stack({
              children: [
                Container({
                  height: 140,
                  width: Infinity,
                  decoration: BoxDecoration({
                    backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)",
                    borderRadius: BorderRadius.circular(12),
                  }),
                }),
                Positioned({
                  left: 16,
                  bottom: 12,
                  child: Text("Titre en surimpression", {
                    style: { color: "white", fontSize: 20, fontWeight: FontWeight.bold },
                  }),
                }),
                Positioned({
                  top: 8,
                  right: 8,
                  child: Container({
                    padding: EdgeInsets.symmetric({ horizontal: 8, vertical: 2 }),
                    decoration: BoxDecoration({ color: colors.surface, borderRadius: BorderRadius.circular(999) }),
                    child: Text(`${this.likes} ♥`, { style: { color: colors.onSurface } }),
                  }),
                }),
              ],
            }),
          }),

          sectionTitle(`GridView.count — ${columns} colonnes selon la largeur`),
          GridView.count({
            crossAxisCount: columns,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            padding: EdgeInsets.symmetric({ horizontal: 16 }),
            shrinkWrap: true,
            children: Array.from({ length: 9 }, (_, i) =>
              Container({
                alignment: Alignment.center,
                height: Infinity,
                decoration: BoxDecoration({
                  color: `hsl(${i * 40}, 70%, 85%)`,
                  borderRadius: BorderRadius.circular(8),
                }),
                child: Text(`Case ${i + 1}`, { style: { color: "#1f2937" } }),
              })
            ),
          }),

          SizedBox({ height: 96 }), // espace sous le bouton flottant
          Container({ alignment: Alignment.center, child: Text("Fin de la page", { style: { color: colors.onSurfaceVariant } }) }),
          SizedBox({ height: 24 }),
        ],
      }),
    });
  }
}
