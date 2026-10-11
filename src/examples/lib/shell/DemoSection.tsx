import type { ReactNode } from "react";
import {
  Card,
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  Padding,
  StatelessWidget,
  Text,
  Theme,
} from "../../../index";

interface DemoSectionProps {
  title: string;
  description?: string;
  child: ReactNode;
}

/** Une démo du catalogue : titre, explication, puis la démo dans une carte. */
export function DemoSection(props: DemoSectionProps) {
  return DemoSectionView.new(props);
}

class DemoSectionView extends StatelessWidget<DemoSectionProps> {
  override build() {
    const { title, description, child } = this.props;
    const theme = Theme.of();

    return Card({
      child: Padding({
        padding: EdgeInsets.all(20),
        child: Column({
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            Column({
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 4,
              children: [
                Text(title, { style: theme.textTheme.titleMedium }),
                description && Text(description, { style: { color: theme.colorScheme.onSurfaceVariant } }),
              ],
            }),
            child,
          ],
        }),
      }),
    });
  }
}
