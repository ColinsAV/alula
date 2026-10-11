import {
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  Padding,
  StatelessWidget,
  TextButton,
  useNavigator,
} from "../../../index";
import { GreetingCard } from "../widgets/statelessWidget";

type GreetingPageProps = { name: string };

export class GreetingPage extends StatelessWidget<GreetingPageProps> {
  static route = "/greeting/:name";
  static metadata = ({ name }: GreetingPageProps) => ({
    title: `Bonjour ${name}`,
    description: `Carte de bienvenue pour ${name}.`,
  });

  override build() {
    const nav = useNavigator();

    return Padding({
      padding: EdgeInsets.all(24),
      child: Column({
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          GreetingCard.new({ name: this.props.name }),
          TextButton({ onPressed: nav.pop, child: "← Retour" }),
        ],
      }),
    });
  }
}
