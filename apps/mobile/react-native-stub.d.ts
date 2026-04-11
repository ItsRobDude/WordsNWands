declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

declare module "react-native" {
  export function SafeAreaView(props: unknown): JSX.Element;
  export function View(props: unknown): JSX.Element;
  export function Text(props: unknown): JSX.Element;

  export const StyleSheet: {
    create<T>(styles: T): T;
  };
}
