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
          <Pressable
            key={tile.id}
            onPress={() => props.on_tile_press(tile)}
            style={[
              styles.tile,
              isSelected ? styles.tileSelected : null,
              tile.state ? styles.tileAffected : null,
            ]}
          >
            <Text style={styles.tileLetter}>{tile.letter}</Text>
            {describeTileState(tile.state) ? (
              <Text style={styles.tileMeta}>
                {describeTileState(tile.state)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  ));
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}
