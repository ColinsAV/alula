import {
  AlertDialog,
  Column,
  CrossAxisAlignment,
  Dialog,
  EdgeInsets,
  ElevatedButton,
  FontWeight,
  OutlinedButton,
  Padding,
  showDialog,
  showModalBottomSheet,
  showSnackBar,
  SimpleDialog,
  SimpleDialogOption,
  SnackBar,
  SnackBarAction,
  StatefulWidget,
  Text,
  TextButton,
  Wrap,
} from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

type Fruit = "Pomme" | "Poire" | "Kiwi";
const FRUITS: Fruit[] = ["Pomme", "Poire", "Kiwi"];

export class PopupsPage extends StatefulWidget {
  static route = "/popups";
  static metadata = () => ({
    title: "Pop-up",
    description: "showDialog, AlertDialog, SimpleDialog, showModalBottomSheet, showSnackBar.",
  });

  private items = 3;
  private fruit: Fruit | undefined = undefined;

  override initState() {}

  private async deleteAll() {
    const confirmed = await showDialog<boolean>({
      builder: (close) =>
        AlertDialog({
          title: Text("Tout supprimer ?"),
          content: Text(`Les ${this.items} éléments seront supprimés.`),
          actions: [
            TextButton({ onPressed: () => close(false), child: "Annuler" }),
            TextButton({ onPressed: () => close(true), child: "Supprimer" }),
          ],
        }),
    });
    if (!confirmed) return;
    const previous = this.items;
    this.setState(() => { this.items = 0; });
    showSnackBar(
      SnackBar({
        content: "Éléments supprimés",
        action: SnackBarAction({ label: "Annuler", onPressed: () => this.setState(() => { this.items = previous; }) }),
      })
    );
  }

  private async chooseFruit() {
    const fruit = await showDialog<Fruit>({
      builder: (close) =>
        SimpleDialog({
          title: Text("Choisir un fruit"),
          children: FRUITS.map((f) => SimpleDialogOption({ onPressed: () => close(f), child: Text(f) })),
        }),
    });
    if (fruit) this.setState(() => { this.fruit = fruit; });
  }

  private showCustomDialog() {
    showDialog({
      builder: (close) =>
        Dialog({
          child: Padding({
            padding: EdgeInsets.all(24),
            child: Column({
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 12,
              children: [
                Text("Dialog libre", { style: { fontSize: 18, fontWeight: FontWeight.w600 } }),
                Text("Le contenu est entièrement à vous."),
                ElevatedButton({ onPressed: () => close(), child: "Fermer" }),
              ],
            }),
          }),
        }),
    });
  }

  private openSheet() {
    showModalBottomSheet({
      builder: (close) =>
        Padding({
          padding: EdgeInsets.all(24),
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Text("Bottom sheet", { style: { fontSize: 18, fontWeight: FontWeight.w600 } }),
              Text("Un panneau qui monte du bas de l'écran. Cliquez à côté pour le fermer."),
              ElevatedButton({ onPressed: () => close(), child: "Fermer" }),
            ],
          }),
        }),
    });
  }

  override build() {
    return DemoShell({
      current: PopupsPage.route,
      title: "Pop-up",
      description: "Ouverts par une fonction depuis un callback, comme en Flutter. La promesse renvoie le résultat.",
      children: [
        DemoSection({
          title: "AlertDialog + SnackBar",
          description: `${this.items} élément(s). La SnackBar propose d'annuler.`,
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Wrap({
                spacing: 8,
                children: [
                  ElevatedButton({ onPressed: this.items > 0 ? () => this.deleteAll() : null, child: "Tout supprimer" }),
                  OutlinedButton({ onPressed: () => this.setState(() => { this.items++; }), child: "Ajouter" }),
                ],
              }),
              CodeBlock({
                code: `const ok = await showDialog<boolean>({
  builder: (close) => AlertDialog({
    title: Text("Tout supprimer ?"),
    actions: [
      TextButton({ onPressed: () => close(false), child: "Annuler" }),
      TextButton({ onPressed: () => close(true), child: "Supprimer" }),
    ],
  }),
});`,
              }),
            ],
          }),
        }),

        DemoSection({
          title: "SimpleDialog",
          description: `Choix : ${this.fruit ?? "aucun"}`,
          child: ElevatedButton({ onPressed: () => this.chooseFruit(), child: "Choisir un fruit" }),
        }),

        DemoSection({
          title: "Dialog libre et bottom sheet",
          child: Wrap({
            spacing: 8,
            children: [
              ElevatedButton({ onPressed: () => this.showCustomDialog(), child: "Dialog" }),
              ElevatedButton({ onPressed: () => this.openSheet(), child: "Bottom sheet" }),
            ],
          }),
        }),
      ],
    });
  }
}
