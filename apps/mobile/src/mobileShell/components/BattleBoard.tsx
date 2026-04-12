import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

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
            on_tile_press={props.on_tile_press}
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
}): JSX.Element {
  return (
    <Pressable
      onPress={() => props.on_tile_press(props.tile)}
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
    </Pressable>
  );
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}
