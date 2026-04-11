declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

declare module "react" {
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(
    initialValue: T,
  ): [T, (value: T | ((current: T) => T)) => void];
}

declare module "react-native" {
  export function SafeAreaView(props: unknown): JSX.Element;
  export function ScrollView(props: unknown): JSX.Element;
  export function View(props: unknown): JSX.Element;
  export function Text(props: unknown): JSX.Element;
  export function Pressable(props: unknown): JSX.Element;

  export const StyleSheet: {
    create<T>(styles: T): T;
  };
}
