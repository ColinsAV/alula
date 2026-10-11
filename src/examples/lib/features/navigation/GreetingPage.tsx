import { StatelessWidget, TextButton, useNavigator } from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";
import { GreetingCard } from "./GreetingCard";

type GreetingPageProps = { name: string };

/** Page avec un paramètre d'URL : `/navigation/greeting/Bob` → `props.name === "Bob"`. */
export class GreetingPage extends StatelessWidget<GreetingPageProps> {
  static route = "/navigation/greeting/:name";
  static metadata = ({ name }: GreetingPageProps) => ({
    title: `Bonjour ${name}`,
    description: `Carte de bienvenue pour ${name}.`,
  });

  override build() {
    const nav = useNavigator();

    return DemoShell({
      current: "/navigation",
      title: `Bonjour ${this.props.name}`,
      description: "Le paramètre :name de la route est devenu une prop de la page. Rechargez : la page est rendue par le serveur.",
      children: [
        DemoSection({
          title: "GreetingCard",
          child: GreetingCard.new({ name: this.props.name, message: "Cette page a sa propre URL." }),
        }),
        TextButton({ onPressed: nav.canPop ? nav.pop : null, child: "← Retour" }),
      ],
    });
  }
}
