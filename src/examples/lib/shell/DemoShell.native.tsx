import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import {
  AppBar,
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  EdgeInsets,
  Icon,
  ListView,
  NavLink,
  Row,
  Scaffold,
  StatelessWidget,
  Text,
  Theme,
  ThemeModeButton,
} from "../../../index";
import { SECTIONS } from "./sections";

// Version mobile de la coquille du catalogue : même API que DemoShell.tsx,
// avec les sections dans une rangée défilante sous l'AppBar.

interface DemoShellProps {
  current: string;
  title: string;
  description?: string;
  children: ReactNode[];
}

export function DemoShell(props: DemoShellProps) {
  return DemoShellView.new(props);
}

class DemoShellView extends StatelessWidget<DemoShellProps> {
  override build() {
    const { current, title, description, children } = this.props;
    const theme = Theme.of();
    const colors = theme.colorScheme;

    const menu = (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 8, gap: 4 }}>
        {SECTIONS.map((section) => {
          const selected = current === section.route;
          return (
            <NavLink key={section.route} to={section.route as "/"}>
              {Container({
                padding: EdgeInsets.symmetric({ horizontal: 12, vertical: 8 }),
                decoration: BoxDecoration({
                  color: selected ? colors.surfaceContainer : undefined,
                  borderRadius: BorderRadius.circular(8),
                }),
                child: Row({
                  spacing: 8,
                  children: [
                    Icon(section.icon, { size: 18, color: selected ? colors.primary : colors.onSurfaceVariant }),
                    Text(section.label, { style: { color: selected ? colors.primary : colors.onSurface, fontWeight: selected ? 600 : 400 } }),
                  ],
                }),
              })}
            </NavLink>
          );
        })}
      </ScrollView>
    );

    return Scaffold({
      appBar: AppBar({ title: "alula", actions: [ThemeModeButton()] }),
      body: Column({
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: "max",
        children: [
          menu,
          ListView({
            padding: EdgeInsets.all(16),
            children: [
              Column({
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 20,
                children: [
                  Column({
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 6,
                    children: [
                      Text(title, { style: theme.textTheme.headlineSmall }),
                      description && Text(description, { style: { color: colors.onSurfaceVariant } }),
                    ],
                  }),
                  ...children,
                ],
              }),
            ],
          }),
        ],
      }),
    });
  }
}
