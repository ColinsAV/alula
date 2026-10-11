import { StatelessWidget, Text, TextButton, useNavigator } from "../../../../index";
import { DemoSection } from "../../shell/DemoSection";
import { DemoShell } from "../../shell/DemoShell";

/** Pas de `static route` : page empilée avec nav.push(DetailPage), sans URL. */
export class DetailPage extends StatelessWidget<{ from?: string }> {
  override build() {
    const nav = useNavigator();

    return DemoShell({
      current: "/navigation",
      title: "Page sans route",
      description: "Empilée avec push(DetailPage) : l'URL ne change pas, et la page du dessous reste montée.",
      children: [
        DemoSection({
          title: "Props reçues",
          child: Text(`from = ${this.props.from ?? "(aucune)"}`),
        }),
        TextButton({ onPressed: nav.pop, child: "← Retour (pop)" }),
      ],
    });
  }
}
