import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import {
  Column,
  Icon,
  IconButton,
  Row,
  StatefulWidget,
  Text,
  TextButton,
  Theme,
} from "../../../../index";

/** Un compteur : le « hello world » du StatefulWidget. */
export class Counter extends StatefulWidget<{}, { initialValue?: number }> {
  private count = 0;

  override initState() {
    this.count = this.props.initialValue ?? 0;
  }

  private add(delta: number) {
    this.setState(() => { this.count += delta; });
  }

  override build() {
    const theme = Theme.of();
    const count = this.count;

    return Column({
      spacing: 8,
      children: [
        Row({
          spacing: 16,
          children: [
            IconButton({ icon: Icon(RemoveIcon), tooltip: "Retirer 1", onPressed: () => this.add(-1) }),
            Text(count, { style: { ...theme.textTheme.displaySmall, color: theme.colorScheme.primary } }),
            IconButton({ icon: Icon(AddIcon), tooltip: "Ajouter 1", onPressed: () => this.add(1) }),
          ],
        }),
        TextButton({
          onPressed: count === 0 ? null : () => this.setState(() => { this.count = 0; }),
          child: "Remettre à zéro",
        }),
      ],
    });
  }
}
