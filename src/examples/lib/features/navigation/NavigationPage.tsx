import {
  Column,
  CrossAxisAlignment,
  ElevatedButton,
  Expanded,
  InputDecoration,
  NavLink,
  OutlinedButton,
  Row,
  StatefulWidget,
  Text,
  TextField,
  useNavigator,
  Wrap,
} from "../../../../index";
import { CodeBlock } from "../../shell/CodeBlock";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";
import { DetailPage } from "./DetailPage";

export class NavigationPage extends StatefulWidget {
  static route = "/navigation";
  static metadata = () => ({
    title: "Navigation",
    description: "Navigator façon Flutter : push, pushNamed, paramètres d'URL, NavLink, onglets.",
  });

  private name = "Bob";

  override initState() {}

  override build() {
    const nav = useNavigator();

    return DemoShell({
      current: NavigationPage.route,
      title: "Navigation",
      description:
        "Une pile de pages comme le Navigator de Flutter, synchronisée avec l'URL et le bouton retour du navigateur.",
      children: [
        DemoSection({
          title: "pushNamed avec paramètres",
          description: "La route /navigation/greeting/:name reçoit le nom en prop. Chaque page a sa propre URL.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Row({
                spacing: 12,
                children: [
                  Expanded({
                    child: TextField({
                      value: this.name,
                      onChanged: (value) => this.setState(() => { this.name = value; }),
                      decoration: InputDecoration({ labelText: "Nom" }),
                    }),
                  }),
                  ElevatedButton({
                    onPressed: this.name.trim()
                      ? () => nav.pushNamed("/navigation/greeting/:name", { name: this.name.trim() })
                      : null,
                    child: "pushNamed",
                  }),
                ],
              }),
              CodeBlock({ code: `nav.pushNamed("/navigation/greeting/:name", { name: "${this.name}" })` }),
            ],
          }),
        }),

        DemoSection({
          title: "NavLink",
          description: "Un vrai lien <a href> (indexé, ouvrable dans un nouvel onglet), préchargé au survol.",
          child: Wrap({
            spacing: 16,
            runSpacing: 8,
            children: [
              <NavLink to="/navigation/greeting/:name" params={{ name: "Alice" }}>
                Bonjour Alice →
              </NavLink>,
              <NavLink to="/navigation/tabs">Démo des onglets →</NavLink>,
            ],
          }),
        }),

        DemoSection({
          title: "push sans route",
          description: "Empile une page à partir de sa classe et de ses props, sans changer l'URL.",
          child: Column({
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 12,
            children: [
              OutlinedButton({ onPressed: () => nav.push(DetailPage, { from: "NavigationPage" }), child: "push(DetailPage)" }),
              Text(`Profondeur de la pile : ${nav.depth}`),
            ],
          }),
        }),
      ],
    });
  }
}
