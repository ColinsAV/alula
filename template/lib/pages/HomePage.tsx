import {
  AppBar,
  Column,
  EdgeInsets,
  Icon,
  IconButton,
  Icons,
  Padding,
  Row,
  Scaffold,
  StatefulWidget,
  Text,
  Theme,
  ThemeModeButton,
} from "@keetlab/better";

/** La page d'accueil (`/`). Ajoutez d'autres pages avec `static route`. */
export class HomePage extends StatefulWidget {
  static route = "/";
  static metadata = () => ({ title: "{{title}}" });

  private count = 0;

  override build() {
    const theme = Theme.of();

    return Scaffold({
      appBar: AppBar({ title: Text("{{title}}"), actions: [ThemeModeButton()] }),
      body: Padding({
        padding: EdgeInsets.all(24),
        child: Column({
          spacing: 16,
          children: [
            Text("Bienvenue dans votre app better.", { style: theme.textTheme.titleLarge }),
            Text("Modifiez lib/pages/HomePage.tsx pour commencer."),
            Row({
              spacing: 16,
              children: [
                IconButton({ icon: Icon(Icons.remove), tooltip: "Retirer 1", onPressed: () => this.setState(() => { this.count--; }) }),
                Text(this.count, { style: { ...theme.textTheme.displaySmall, color: theme.colorScheme.primary } }),
                IconButton({ icon: Icon(Icons.add), tooltip: "Ajouter 1", onPressed: () => this.setState(() => { this.count++; }) }),
              ],
            }),
          ],
        }),
      }),
    });
  }
}
