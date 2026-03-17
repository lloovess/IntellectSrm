import { CollectionTask, NewCollectionTask, CollectionNote, NewCollectionNote } from "@/lib/db/schema/collection-tasks";

export type { CollectionTask, NewCollectionTask, CollectionNote, NewCollectionNote };

export type CollectionStatus = 'open' | 'in_progress' | 'promised' | 'resolved' | 'closed';
