import {
  Checkbox,
  CircularProgressIndicator,
  Column,
  CrossAxisAlignment,
  Divider,
  DropdownButton,
  DropdownMenuItem,
  ElevatedButton,
  FloatingActionButton,
  Icon,
  IconButton,
  Icons,
  InputDecoration,
  LinearProgressIndicator,
  ListTile,
  OutlinedButton,
  Radio,
  Row,
  SizedBox,
  Slider,
  StatefulWidget,
  Switch,
  Text,
  TextButton,
  TextField,
  TextInputType,
  Theme,
  Wrap,
} from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

type Plan = "Gratuit" | "Pro" | "Équipe";
const PLANS: Plan[] = ["Gratuit", "Pro", "Équipe"];
const COUNTRIES = ["France", "Belgique", "Suisse", "Canada"];

export class MaterialPage extends StatefulWidget {
  static route = "/material";
  static metadata = () => ({
    title: "Widgets Material",
    description: "Boutons, TextField, DropdownButton, Checkbox, Switch, Radio, Slider, ListTile.",
  });

  private clicks = 0;
  private email = "";
  private password = "";
  private showPassword = false;
  private country: string | undefined = undefined;
  private wifi = true;
  private notifications: boolean | null = null;
  private plan: Plan = "Pro";
  private volume = 0.4;

  override initState() {}

  override build() {
    const colors = Theme.of().colorScheme;
    const emailError = this.email && !this.email.includes("@") ? "Adresse invalide" : undefined;

    return DemoShell({
      current: MaterialPage.route,
      title: "Material",
      description: "Les widgets Material de Flutter, rendus par MUI et stylés par le thème.",
      children: [
        DemoSection({
          title: "Boutons",
          description: "onPressed absent ou null : bouton désactivé, comme en Flutter.",
          child: Wrap({
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton({
                onPressed: () => this.setState(() => { this.clicks++; }),
                child: `Cliqué ${this.clicks} fois`,
              }),
              ElevatedButton.icon({
                onPressed: () => this.setState(() => { this.clicks = 0; }),
                icon: Icon(Icons.delete),
                label: "Remettre à zéro",
              }),
              OutlinedButton({ onPressed: () => {}, child: "Outlined" }),
              TextButton({ onPressed: () => {}, child: "Text" }),
              ElevatedButton({ onPressed: null, child: "Désactivé" }),
              IconButton({
                icon: Icon(Icons.add),
                tooltip: "Ajouter 10",
                onPressed: () => this.setState(() => { this.clicks += 10; }),
              }),
              FloatingActionButton.extended({ onPressed: () => {}, icon: Icon(Icons.send), label: "Envoyer" }),
            ],
          }),
        }),

        DemoSection({
          title: "TextField",
          description: "Champ contrôlé, erreur de validation, mot de passe avec bouton afficher / masquer.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 16,
            children: [
              TextField({
                value: this.email,
                keyboardType: TextInputType.emailAddress,
                onChanged: (value) => this.setState(() => { this.email = value; }),
                decoration: InputDecoration({
                  labelText: "E-mail",
                  hintText: "vous@exemple.fr",
                  errorText: emailError,
                  prefixIcon: Icon(Icons.search, { color: colors.onSurfaceVariant }),
                }),
              }),
              TextField({
                value: this.password,
                obscureText: !this.showPassword,
                onChanged: (value) => this.setState(() => { this.password = value; }),
                decoration: InputDecoration({
                  labelText: "Mot de passe",
                  helperText: "8 caractères minimum",
                  suffixIcon: IconButton({
                    icon: Icon(this.showPassword ? Icons.visibility_off : Icons.visibility),
                    tooltip: this.showPassword ? "Masquer" : "Afficher",
                    onPressed: () => this.setState(() => { this.showPassword = !this.showPassword; }),
                  }),
                }),
              }),
            ],
          }),
        }),

        DemoSection({
          title: "DropdownButton",
          description: "Liste déroulante avec texte d'invite tant que rien n'est choisi.",
          child: SizedBox({
            width: 280,
            child: DropdownButton({
              labelText: "Pays",
              hint: Text("Choisir un pays"),
              value: this.country,
              isExpanded: true,
              items: COUNTRIES.map((c) => DropdownMenuItem({ value: c, child: Text(c) })),
              onChanged: (c) => this.setState(() => { this.country = c; }),
            }),
          }),
        }),

        DemoSection({
          title: "ListTile et contrôles",
          description: "Switch, Checkbox à trois états et Radio dans des lignes de liste.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ListTile({
                leading: Icon(Icons.wifi),
                title: "Wi-Fi",
                subtitle: this.wifi ? "Connecté" : "Désactivé",
                trailing: Switch({ value: this.wifi, onChanged: (v) => this.setState(() => { this.wifi = v; }) }),
              }),
              Divider(),
              ListTile({
                leading: Icon(Icons.notifications),
                title: "Notifications",
                subtitle: "Oui / non / indéterminé",
                trailing: Checkbox({
                  value: this.notifications,
                  tristate: true,
                  onChanged: (v) => this.setState(() => { this.notifications = v; }),
                }),
              }),
              Divider(),
              ...PLANS.map((plan) =>
                ListTile({
                  title: plan,
                  onTap: () => this.setState(() => { this.plan = plan; }),
                  leading: Radio({
                    value: plan,
                    groupValue: this.plan,
                    onChanged: (p) => this.setState(() => { this.plan = p; }),
                  }),
                })
              ),
            ],
          }),
        }),

        DemoSection({
          title: `Slider et indicateurs — ${Math.round(this.volume * 100)} %`,
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 16,
            children: [
              Slider({
                value: this.volume,
                divisions: 10,
                label: `${Math.round(this.volume * 100)} %`,
                onChanged: (v) => this.setState(() => { this.volume = v; }),
              }),
              Row({
                spacing: 24,
                children: [CircularProgressIndicator(), CircularProgressIndicator({ value: this.volume })],
              }),
              LinearProgressIndicator(),
              LinearProgressIndicator({ value: this.volume }),
            ],
          }),
        }),
      ],
    });
  }
}
