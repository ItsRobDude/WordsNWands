import { useMemo, useRef } from "react";
import { Text, View } from "react-native";

import type {
  BoardPosition,
  BoardTile,
  EncounterRuntimeState,
} from "../../../../../packages/game-rules/src/index.ts";
import { describeTileState } from "../../verticalSlice/formatters.ts";
import { styles } from "../mobileStyles.ts";
import type { TileTouchFrame } from "../screens/boardTouch.ts";

export function BattleBoard(props: {
  state: EncounterRuntimeState;
  selected_path: readonly BoardPosition[];
  on_tile_layout?: (frame: TileTouchFrame) => void;
}): JSX.Element[] {
  const selectedKeys = new Set(props.selected_path.map(toPositionKey));
  const tilesByPosition = useMemo(
    () =>
      new Map(
        props.state.board.tiles.map((tile) => [
          toPositionKey(tile.position),
          tile,
        ]),
      ),
    [props.state.board.tiles],
  );

  return Array.from({ length: props.state.board.height }, (_, rowIndex) => (
    <View key={`row-${rowIndex}`} style={styles.boardRow}>
      {Array.from({ length: props.state.board.width }, (_, colIndex) => {
        const tile = tilesByPosition.get(`${rowIndex}:${colIndex}`);

        if (!tile) {
          return (
            <View key={`empty-${rowIndex}-${colIndex}`} style={styles.tile} />
          );
        }

        const isSelected = selectedKeys.has(toPositionKey(tile.position));

        return (
          <BattleTile
            key={tile.id}
            tile={tile}
            is_selected={isSelected}
            on_tile_layout={
              props.on_tile_layout
                ? (frame) =>
                    props.on_tile_layout?.({
                      ...frame,
                      row: rowIndex,
                      col: colIndex,
                    })
                : undefined
            }
          />
        );
      })}
    </View>
  ));
}

function BattleTile(props: {
  tile: BoardTile;
  is_selected: boolean;
  on_tile_layout?: (frame: Omit<TileTouchFrame, "row" | "col">) => void;
}): JSX.Element {
  const tileRef = useRef<View | null>(null);

  return (
    <View
      ref={(node) => {
        tileRef.current = node;
      }}
      onLayout={(event) => {
        const fallbackFrame = {
          tile_left_px: event.nativeEvent.layout.x,
          tile_top_px: event.nativeEvent.layout.y,
          tile_width_px: event.nativeEvent.layout.width,
          tile_height_px: event.nativeEvent.layout.height,
        };
        if (!tileRef.current) {
          props.on_tile_layout?.(fallbackFrame);
          return;
        }

        tileRef.current.measureInWindow((left, top, width, height) => {
          props.on_tile_layout?.({
            tile_left_px: left,
            tile_top_px: top,
            tile_width_px: width || fallbackFrame.tile_width_px,
            tile_height_px: height || fallbackFrame.tile_height_px,
          });
        });
      }}
      style={[
        styles.tile,
        props.is_selected ? styles.tileSelected : null,
        props.tile.state ? styles.tileAffected : null,
      ]}
    >
      <View style={styles.tileContent}>
        <Text style={styles.tileLetter}>{props.tile.letter}</Text>
        {describeTileState(props.tile.state) ? (
          <Text style={styles.tileMeta}>
            {describeTileState(props.tile.state)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}
