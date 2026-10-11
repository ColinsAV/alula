import {
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  ElevatedButton,
  FontWeight,
  NavLink,
  Padding,
  Row,
  StatelessWidget,
  Text,
  useNavigator,
} from "../../../index";
import { QuoteCard } from "../widgets/QuoteCard";
import { Counter } from "../widgets/statefullWidget";
import { GreetingCard } from "../widgets/statelessWidget";
import { DetailPage } from "./DetailPage";

const title = (text: string) => Text(text, { style: { fontSize: 18, fontWeight: FontWeight.w600 } });

export class HomePage extends StatelessWidget {
  static route = "/";
  static metadata = () => ({
    title: "Better — exemples",
    description: "Démo des widgets et du Navigator.",
  });

  override build() {
    const nav = useNavigator();

    return Padding({
      padding: EdgeInsets.all(24),
      child: Column({
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          title("StatelessWidget"),
          GreetingCard.new({ name: "Alice", message: "Ravi de te revoir." }),

          title("StatefulWidget"),
          Counter.new({ initialValue: 3 }),

          title("FutureBuilder"),
          QuoteCard.new(),

          title("Navigator"),
          // Motif en texte plutôt que `to={GreetingPage}` : importer la classe
          // embarquerait GreetingPage dans le chunk de HomePage.
          Row({
            spacing: 12,
            children: [
              <NavLink to="/greeting/:name" params={{ name: "Bob" }}>
                NavLink → /greeting/Bob
              </NavLink>,
              <NavLink to="/widgets">Catalogue de widgets →</NavLink>,
              <NavLink to="/widgets/material">Widgets Material →</NavLink>,
              <NavLink to="/widgets/tabs">Onglets →</NavLink>,
              <NavLink to="/widgets/animations">Animations →</NavLink>,
              ElevatedButton({ onPressed: () => nav.push(DetailPage), child: "push(DetailPage)" }),
            ],
          }),
        ],
      }),
    });
  }
}
