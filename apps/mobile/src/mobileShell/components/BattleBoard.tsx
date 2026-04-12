import { useMemo, useState } from "react";
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
  const [rowOffsets, setRowOffsets] = useState<Record<number, number>>({});
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

  return Array.from({ length: props.state.board.height }, (_, rowIndex) => {
    const rowTopPx = rowOffsets[rowIndex] ?? 0;

    return (
      <View
        key={`row-${rowIndex}`}
        style={styles.boardRow}
        onLayout={(event) => {
          const nextOffset = event.nativeEvent.layout.y;
          setRowOffsets((current) =>
            current[rowIndex] === nextOffset
              ? current
              : {
                  ...current,
                  [rowIndex]: nextOffset,
                },
          );
        }}
      >
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
                        tile_top_px: frame.tile_top_px + rowTopPx,
                      })
                  : undefined
              }
            />
          );
        })}
      </View>
    );
  });
}

function BattleTile(props: {
  tile: BoardTile;
  is_selected: boolean;
  on_tile_layout?: (frame: Omit<TileTouchFrame, "row" | "col">) => void;
}): JSX.Element {
  return (
    <View
      onLayout={(event) => {
        props.on_tile_layout?.({
          tile_left_px: event.nativeEvent.layout.x,
          tile_top_px: event.nativeEvent.layout.y,
          tile_width_px: event.nativeEvent.layout.width,
          tile_height_px: event.nativeEvent.layout.height,
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
