import { Pressable, Text, View } from "react-native";
import { useRef } from "react";

import type {
  BoardPosition,
  BoardTile,
  EncounterRuntimeState,
} from "../../../../../packages/game-rules/src/index.ts";
import { describeTileState } from "../../verticalSlice/formatters.ts";
import { styles } from "../mobileStyles.ts";

export function BattleBoard(props: {
  state: EncounterRuntimeState;
  selected_path: readonly BoardPosition[];
  on_tile_press: (tile: BoardTile) => void;
  on_tile_frame?: (input: {
    position: BoardPosition;
    left_px: number;
    top_px: number;
    right_px: number;
    bottom_px: number;
  }) => void;
}): JSX.Element[] {
  const selectedKeys = new Set(props.selected_path.map(toPositionKey));

  return Array.from({ length: props.state.board.height }, (_, rowIndex) => (
    <View key={`row-${rowIndex}`} style={styles.boardRow}>
      {Array.from({ length: props.state.board.width }, (_, colIndex) => {
        const tile = props.state.board.tiles.find(
          (candidate) =>
            candidate.position.row === rowIndex &&
            candidate.position.col === colIndex,
        );

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
            on_tile_press={props.on_tile_press}
            on_tile_frame={props.on_tile_frame}
          />
        );
      })}
    </View>
  ));
}

function BattleTile(props: {
  tile: BoardTile;
  is_selected: boolean;
  on_tile_press: (tile: BoardTile) => void;
  on_tile_frame?: (input: {
    position: BoardPosition;
    left_px: number;
    top_px: number;
    right_px: number;
    bottom_px: number;
  }) => void;
}): JSX.Element {
  const tileRef = useRef<View | null>(null);

  return (
    <Pressable
      onPress={() => props.on_tile_press(props.tile)}
      style={[
        styles.tile,
        props.is_selected ? styles.tileSelected : null,
        props.tile.state ? styles.tileAffected : null,
      ]}
      onLayout={() => {
        requestAnimationFrame(() => {
          tileRef.current?.measureInWindow((x, y, width, height) => {
            props.on_tile_frame?.({
              position: props.tile.position,
              left_px: x,
              top_px: y,
              right_px: x + width,
              bottom_px: y + height,
            });
          });
        });
      }}
    >
      <View ref={tileRef} collapsable={false} style={styles.tileContent}>
        <Text style={styles.tileLetter}>{props.tile.letter}</Text>
        {describeTileState(props.tile.state) ? (
          <Text style={styles.tileMeta}>
            {describeTileState(props.tile.state)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}
