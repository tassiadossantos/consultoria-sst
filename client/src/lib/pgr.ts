// Re-export PGR functions from the centralized API module.
// Preserves the import paths used by pgr-list.tsx, pgr-wizard.tsx, and document-preview.tsx.
export {
  fetchPgrs as listPgrs,
  fetchPgrDetail as getPgrDetail,
  createPgr,
  updatePgr,
  deletePgrApi as deletePgr,
} from "./api";

export type {
  PgrListItem,
  PgrDetail,
  CreatePgrPayload,
  UpdatePgrPayload,
} from "@shared/schema";
