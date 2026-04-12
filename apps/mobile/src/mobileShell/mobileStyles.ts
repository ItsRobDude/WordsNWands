import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f1726",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  frameContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  backgroundOrbA: {
    position: "absolute",
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#f59e0b22",
  },
  backgroundOrbB: {
    position: "absolute",
    left: -40,
    bottom: 60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "#38bdf822",
  },
  header: {
    marginBottom: 18,
    paddingTop: 8,
  },
  overline: {
    color: "#fcd34d",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 8,
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 23,
  },
  stack: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#132033",
    borderWidth: 1,
    borderColor: "#24364f",
  },
  cardWarm: {
    backgroundColor: "#22161c",
    borderColor: "#5b3142",
  },
  cardCool: {
    backgroundColor: "#102536",
    borderColor: "#25455d",
  },
  cardEyebrow: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    marginTop: 6,
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 14,
    gap: 12,
  },
  cardBodyCompact: {
    marginTop: 10,
    gap: 10,
  },
  cardText: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 22,
  },
  cardTextMuted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statsRowCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statPill: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#0b1524",
    borderWidth: 1,
    borderColor: "#24364f",
  },
  statPillCompact: {
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statLabelCompact: {
    fontSize: 10,
  },
  statValue: {
    marginTop: 4,
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  statValueCompact: {
    marginTop: 2,
    fontSize: 15,
  },
  board: {
    flex: 1,
    width: "92%",
    aspectRatio: 1,
    alignSelf: "center",
    maxWidth: 340,
    gap: 4,
  },
  boardRow: {
    flexDirection: "row",
    flex: 1,
    gap: 4,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#08111d",
    borderWidth: 1,
    borderColor: "#28415e",
    minHeight: 0,
    paddingVertical: 4,
  },
  tileContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tileSelected: {
    backgroundColor: "#433316",
    borderColor: "#fbbf24",
  },
  tileAffected: {
    borderColor: "#7dd3fc",
  },
  tileLetter: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  tileMeta: {
    marginTop: 2,
    color: "#7dd3fc",
    fontSize: 10,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  buttonStack: {
    gap: 10,
  },
  button: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#f59e0b",
  },
  buttonSecondary: {
    backgroundColor: "#1f2f47",
    borderWidth: 1,
    borderColor: "#345172",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#345172",
  },
  buttonCompact: {
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: "#5b6472",
    borderColor: "#5b6472",
  },
  buttonLabel: {
    color: "#101827",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  buttonLabelSecondary: {
    color: "#e2e8f0",
  },
  buttonLabelGhost: {
    color: "#bfdbfe",
  },
  encounterScreen: {
    position: "relative",
    flex: 1,
    gap: 8,
  },
  encounterTopCluster: {
    gap: 6,
    flexShrink: 0,
  },
  encounterSummaryCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  encounterSummaryBody: {
    marginTop: 8,
    gap: 8,
  },
  encounterSummaryCopy: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
  encounterBoardCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  encounterBoardBody: {
    flex: 1,
    marginTop: 6,
    gap: 6,
  },
  encounterCardEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
  },
  encounterCardTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  encounterHintBanner: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#132033",
    borderWidth: 1,
    borderColor: "#345172",
  },
  encounterHintText: {
    color: "#e2e8f0",
    fontSize: 13,
    lineHeight: 18,
  },
  boardCaption: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  encounterFeedbackText: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
  },
  launchHeroCard: {
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  launchHeroEyebrow: {
    color: "#fcd34d",
  },
  launchHeroMenuTitle: {
    fontSize: 22,
  },
  launchHeroTitle: {
    marginTop: 4,
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 40,
  },
  launchHeroSubtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 23,
  },
  launchMenuCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  launchMenuNote: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  utilityRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  overlayScrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    justifyContent: "center",
    backgroundColor: "#020617aa",
  },
});
