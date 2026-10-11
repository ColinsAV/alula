import { createElement, type ReactElement, type ReactNode } from "react";

export abstract class StatelessWidget<Props extends object = {}> {
  protected props: Props;

  constructor(props: Props) {
    this.props = props;
  }

  abstract build(): ReactNode;

  /**
   * Construit le widget dans un `build()`, comme le `new` facultatif de Dart :
   * `GreetingCard.new({ name: "Bob" })`.
   */
  static new<P extends object>(
    this: new (props: P) => StatelessWidget<P>,
    ...args: {} extends P ? [props?: P] : [props: P]
  ): ReactElement {
    return createElement(MyStatelessWidget<StatelessWidget<P>, P>, { Component: this, ...(args[0] as P) });
  }
}

export function MyStatelessWidget<T extends StatelessWidget, Props extends object = {}>(
  props: Props & { Component: new (props: Props) => T }
): React.ReactElement {
  const { Component, ...restProps } = props;
  const instance = new Component(restProps as Props);
  return <>{instance.build()}</>;
}