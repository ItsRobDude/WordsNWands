import type {
  RuntimeValidationSnapshot,
  ValidationSnapshotLookupProvider,
} from "./types.ts";
import { InMemoryValidationSnapshotLookup } from "./ValidationSnapshotLookup.ts";

export class InMemoryValidationSnapshotLookupProvider implements ValidationSnapshotLookupProvider {
  private readonly lookupsByVersion: ReadonlyMap<
    string,
    InMemoryValidationSnapshotLookup
  >;

  public constructor(snapshots: readonly RuntimeValidationSnapshot[]) {
    const lookupByVersion = new Map<string, InMemoryValidationSnapshotLookup>();

    for (const snapshot of snapshots) {
      const snapshotVersion = snapshot.metadata.snapshot_version;
      if (lookupByVersion.has(snapshotVersion)) {
        throw new Error(
          `Duplicate validation snapshot version: ${snapshotVersion}`,
        );
      }

      lookupByVersion.set(
        snapshotVersion,
        new InMemoryValidationSnapshotLookup(snapshot),
      );
    }

    this.lookupsByVersion = lookupByVersion;
  }

  public get(snapshot_version: string) {
    const lookup = this.lookupsByVersion.get(snapshot_version);
    if (!lookup) {
      throw new Error(
        `Validation snapshot version not found: ${snapshot_version}`,
      );
    }

    return lookup;
  }
}
