import type { ReactNode } from "react";
import {
  AppBar,
  BorderRadius,
  BoxConstraints,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  EdgeInsets,
  Icon,
  ListView,
  NavLink,
  ResponsiveLayout,
  Row,
  Scaffold,
  StatelessWidget,
  Text,
  Theme,
  ThemeModeButton,
} from "../../../index";
import { SECTIONS } from "./sections";

const plainLink = { color: "inherit", textDecoration: "none" } as const;

interface DemoShellProps {
  /** Route de la section affichée (surlignée dans le menu). */
  current: string;
  title: string;
  description?: string;
  children: ReactNode[];
}

/**
 * La structure des pages du catalogue : AppBar, menu des sections (sur le
 * côté sur grand écran, en haut sur mobile) et contenu centré qui défile.
 */
export function DemoShell(props: DemoShellProps) {
  return DemoShellView.new(props);
}

class DemoShellView extends StatelessWidget<DemoShellProps> {
  override build() {
    const { current, title, description, children } = this.props;
    const theme = Theme.of();

    const header = Column({
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 8,
      children: [
        Text(title, { style: theme.textTheme.headlineMedium }),
        description && Text(description, { style: { ...theme.textTheme.bodyLarge, color: theme.colorScheme.onSurfaceVariant } }),
      ],
    });

    const content = ListView({
      padding: EdgeInsets.symmetric({ horizontal: 16, vertical: 24 }),
      children: [
        Column({
          children: [
            Container({
              width: Infinity,
              constraints: BoxConstraints({ maxWidth: 960 }),
              child: Column({ crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 24, children: [header, ...children] }),
            }),
          ],
        }),
      ],
    });

    return Scaffold({
      appBar: AppBar({
        automaticallyImplyLeading: false,
        title: (
          <NavLink to="/" style={plainLink}>
            alula
          </NavLink>
        ),
        actions: [ThemeModeButton()],
      }),
      // Le menu reste fixe, seul le contenu défile.
      body: (
        <div style={{ flex: "1 1 0%", minHeight: 0, display: "flex" }}>
          {ResponsiveLayout({ compact: null, expanded: SectionMenu.new({ current, vertical: true }) })}
          <div style={{ flex: "1 1 0%", minWidth: 0, display: "flex", flexDirection: "column" }}>
            {ResponsiveLayout({ compact: SectionMenu.new({ current, vertical: false }), expanded: null })}
            {content}
          </div>
        </div>
      ),
    });
  }
}

/** Le menu des sections : colonne sur le côté, ou rangée défilante en haut. */
class SectionMenu extends StatelessWidget<{ current: string; vertical: boolean }> {
  override build() {
    const { current, vertical } = this.props;
    const colors = Theme.of().colorScheme;

    const items = SECTIONS.map((section) => {
      const selected = current === section.route;
      return (
        <NavLink to={section.route as "/"} style={plainLink} aria-current={selected ? "page" : undefined}>
          {Container({
            padding: EdgeInsets.symmetric({ horizontal: 12, vertical: 8 }),
            decoration: BoxDecoration({
              color: selected ? colors.surfaceContainer : undefined,
              borderRadius: BorderRadius.circular(8),
            }),
            child: Row({
              spacing: 12,
              children: [
                Icon(section.icon, { size: 20, color: selected ? colors.primary : colors.onSurfaceVariant }),
                Text(section.label, {
                  softWrap: false,
                  style: { color: selected ? colors.primary : colors.onSurface, fontWeight: selected ? 600 : 400 },
                }),
              ],
            }),
          })}
        </NavLink>
      );
    });

    if (vertical) {
      return (
        <nav style={{ width: 220, flexShrink: 0, overflowY: "auto", padding: 12, borderRight: `1px solid ${colors.outline}` }}>
          {Column({ crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 2, children: items })}
        </nav>
      );
    }
    return (
      <nav style={{ overflowX: "auto", padding: "8px 12px", borderBottom: `1px solid ${colors.outline}`, flexShrink: 0 }}>
        {Row({ spacing: 4, children: items })}
      </nav>
    );
  }
}
